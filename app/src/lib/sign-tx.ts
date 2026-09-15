// Sign and broadcast a parsed sign request, on top of @ecency/sdk/hive.
//
// The parsed operations still carry the `__signer` placeholder in fields the
// schema defaulted (e.g. a vote's `voter`, a transfer's `from`); it is resolved
// to the signing account here, the same substitution the Nuxt app did at sign
// time. ref_block_num / ref_block_prefix / expiration are filled by the SDK's
// Transaction.addOperation (it fetches dynamic global properties via the
// failover callRPC), so this module does not touch them.
import { PrivateKey, Transaction } from '@ecency/sdk/hive';
import type { Operation } from './hive-uri';

const SIGNER = '__signer';

/** Replace the `__signer` placeholder with `username` throughout a value. */
function resolvePlaceholders(value: unknown, username: string): unknown {
  if (typeof value === 'string') return value === SIGNER ? username : value;
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

export interface BroadcastOutcome {
  id: string;
  blockNum?: number;
  trxNum?: number;
}

/**
 * Build a transaction from the operations, sign it with `wif`, and broadcast it
 * through the SDK failover client. `username` resolves `__signer`. Throws the
 * node's error on rejection.
 */
export async function broadcastOperations(
  operations: Operation[],
  wif: string,
  username: string,
): Promise<BroadcastOutcome> {
  const resolved = resolveSigner(operations, username);
  const tx = new Transaction();
  for (const [name, payload] of resolved) {
    // The SDK types operation names/payloads narrowly; our ops come from a
    // decoded URL, so cast at this boundary.
    await tx.addOperation(name as never, payload as never);
  }
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
