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
 * Build and sign a transaction (no broadcast). When `preservedTx` is given (a
 * pre-built /sign/tx request), it is signed EXACTLY as supplied - its
 * ref_block_num / ref_block_prefix / expiration are kept, so the signature
 * matches the caller's own transaction id (needed for multisig collection).
 * Otherwise the operations are assembled fresh and the SDK fills the ref/expiry.
 */
async function buildSigned(
  operations: Operation[],
  wif: string,
  username: string,
  preservedTx?: UnresolvedTx,
): Promise<Transaction> {
  let tx: Transaction;
  if (preservedTx) {
    tx = new Transaction({
      transaction: resolveTx(preservedTx, username) as never,
    });
  } else {
    tx = new Transaction();
    for (const [name, payload] of resolveSigner(operations, username)) {
      // The SDK types operation names/payloads narrowly; our ops come from a
      // decoded URL, so cast at this boundary.
      await tx.addOperation(name as never, payload as never);
    }
  }
  tx.sign(PrivateKey.fromString(wif));
  return tx;
}

/**
 * Sign WITHOUT broadcasting (a no_broadcast / `nb` request): the caller asked
 * only for a signature. Returns the tx id and the signature.
 */
export async function signOperations(
  operations: Operation[],
  wif: string,
  username: string,
  preservedTx?: UnresolvedTx,
): Promise<BroadcastOutcome> {
  const tx = await buildSigned(operations, wif, username, preservedTx);
  const signed = tx.transaction as { signatures?: string[] };
  return { id: tx.digest().txId, signature: signed.signatures?.[0] };
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
  const tx = await buildSigned(operations, wif, username, preservedTx);
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
