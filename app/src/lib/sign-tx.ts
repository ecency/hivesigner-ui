// Sign and broadcast a parsed sign request, on top of @ecency/sdk/hive.
//
// The parsed operations still carry the `__signer` placeholder in fields the
// schema defaulted (e.g. a vote's `voter`, a transfer's `from`); it is resolved
// to the signing account here, the same substitution the Nuxt app did at sign
// time. ref_block_num / ref_block_prefix / expiration are filled by the SDK's
// Transaction.addOperation (it fetches dynamic global properties via the
// failover callRPC), so this module does not touch them.
import { PrivateKey, Transaction } from '@ecency/sdk/hive';
import type { Operation, UnresolvedTx } from './hive-uri';

const SIGNER = /__signer/g;

/**
 * Replace the `__signer` placeholder with `username` throughout a value. Matches
 * hive-uri's resolver: it replaces every occurrence inside any string, not only
 * an exact "__signer" value - a follow custom_json embeds it inside the `json`
 * string (e.g. {"follower":"__signer",...}), which an exact-match would miss.
 */
function resolvePlaceholders(value: unknown, username: string): unknown {
  if (typeof value === 'string') return value.replace(SIGNER, username);
  if (Array.isArray(value))
    return value.map((v) => resolvePlaceholders(v, username));
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value))
      out[k] = resolvePlaceholders(v, username);
    return out;
  }
  return value;
}

/** The operations with every `__signer` resolved to the account name. */
export function resolveSigner(
  operations: Operation[],
  username: string,
): Operation[] {
  return operations.map(([name, payload]) => [
    name,
    resolvePlaceholders(payload, username) as Record<string, unknown>,
  ]);
}

/** A whole pre-built transaction with `__signer` resolved throughout. */
function resolveTx(tx: UnresolvedTx, username: string): UnresolvedTx {
  return resolvePlaceholders(tx, username) as UnresolvedTx;
}

export interface BroadcastOutcome {
  id: string;
  blockNum?: number;
  trxNum?: number;
  /** Present for a sign-only (no_broadcast) result. */
  signature?: string;
}

/**
 * Build an unsigned transaction. `operations` are the PROCESSED operations that
 * the confirm screen displays; they are always what gets signed, so the user
 * signs exactly what they saw. For a /sign/tx request `preservedTx` supplies the
 * caller's own ref_block_num / ref_block_prefix / expiration (so the resulting
 * tx id matches the caller's, e.g. for multisig) while the operations still come
 * from the displayed set - never the raw, unprocessed ops. For op/ops/legacy
 * forms there is no header to preserve and the SDK fills ref/expiry.
 */
async function buildTx(
  operations: Operation[],
  username: string,
  preservedTx?: UnresolvedTx,
): Promise<Transaction> {
  if (preservedTx) {
    const tx = resolveTx({ ...preservedTx, operations }, username);
    return new Transaction({ transaction: tx as never });
  }
  const tx = new Transaction();
  for (const [name, payload] of resolveSigner(operations, username)) {
    // The SDK types operation names/payloads narrowly; our ops come from a
    // decoded URL, so cast at this boundary.
    await tx.addOperation(name as never, payload as never);
  }
  return tx;
}

function signatures(tx: Transaction): string[] {
  const inner = tx.transaction as { signatures?: string[] };
  if (!inner.signatures) inner.signatures = [];
  return inner.signatures;
}

/**
 * Sign WITHOUT broadcasting (a no_broadcast / `nb` request): the caller asked
 * only for a signature. Returns the tx id and the signature THIS key added
 * (not signatures[0], which for a partially-signed multisig tx is another
 * party's signature).
 */
export async function signOperations(
  operations: Operation[],
  wif: string,
  username: string,
  preservedTx?: UnresolvedTx,
): Promise<BroadcastOutcome> {
  const tx = await buildTx(operations, username, preservedTx);
  const before = signatures(tx).length;
  tx.sign(PrivateKey.fromString(wif));
  return { id: tx.digest().txId, signature: signatures(tx)[before] };
}

/**
 * Build, sign and broadcast the operations through the SDK failover client.
 * `username` resolves `__signer`. Throws the node's error on rejection.
 */
export async function broadcastOperations(
  operations: Operation[],
  wif: string,
  username: string,
  preservedTx?: UnresolvedTx,
): Promise<BroadcastOutcome> {
  const tx = await buildTx(operations, username, preservedTx);
  tx.sign(PrivateKey.fromString(wif));
  const result = (await tx.broadcast()) as {
    id?: string;
    tx_id?: string;
    block_num?: number;
    trx_num?: number;
  };
  return {
    id: result.id ?? result.tx_id ?? tx.digest().txId,
    blockNum: result.block_num,
    trxNum: result.trx_num,
  };
}
