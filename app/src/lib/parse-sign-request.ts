// Turn a /sign/* URL into a processed, ready-to-confirm request. Mirrors the
// Nuxt sign page's parseUri + processTransaction: build a hive: URI from the
// path splat and query, decode it (tx / op / ops), fall back to the legacy
// /sign/<opname>?params form, then normalize each operation against the schema.
//
// Signing/broadcast/redirect are intentionally not here: they need a logged-in
// key and browser-native crypto, and follow with the login/key work.
import {
  type DecodeResult,
  decode,
  encodeOps,
  type Operation,
} from './hive-uri';
import { OPERATIONS } from './operations';
import { processValue } from './process-value';

export interface SignRequest {
  operations: Operation[];
  callback?: string;
  noBroadcast: boolean;
  signer?: string;
}

/** camelCase / kebab-case operation name to snake_case (transferToVesting -> transfer_to_vesting). */
function snakeCase(input: string): string {
  return input
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[-\s]+/g, '_')
    .toLowerCase();
}

/** ?a=b&c=d for the query object, dropping requestId, matching buildSearchParams. */
export function buildSearchParams(query: Record<string, string>): string {
  const keys = Object.keys(query).filter((k) => k !== 'requestId');
  if (keys.length === 0) return '';
  return `?${keys.map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(query[k])}`).join('&')}`;
}

/** Legacy /sign/<opname>?params -> a DecodeResult, via the operation schema. */
function legacyToHiveUri(
  splat: string,
  query: Record<string, string>,
): DecodeResult | null {
  try {
    const opName = snakeCase((splat.split('/')[0] ?? '').split('?')[0]);
    if (!OPERATIONS[opName]) return null;

    const opParams: Record<string, unknown> = {};
    for (const key of Object.keys(OPERATIONS[opName].schema)) {
      const raw = query[key];
      if (raw === undefined || raw === '') continue;
      const { type } = OPERATIONS[opName].schema[key];
      let value: unknown = raw;
      if (type === 'array' || type === 'object') {
        try {
          value = JSON.parse(raw);
        } catch {
          value = raw || {};
        }
      }
      if (type === 'bool') {
        value = ['true', true, 1, '1'].includes(value as string);
      }
      opParams[key] = value;
    }
    return decode(
      encodeOps([[opName, opParams]], { callback: query.redirect_uri }),
    );
  } catch {
    return null;
  }
}

/**
 * @param splat the part after /sign/ (e.g. "vote", "op/<b64>", "transferToVesting")
 * @param query the search params
 * @param vestsToSP total_vesting_fund_hive / total_vesting_shares, for HP amounts
 * @returns the processed request, or null when the URL is not a valid signable op
 */
export function parseSignRequest(
  splat: string,
  query: Record<string, string>,
  vestsToSP: number,
): SignRequest | null {
  const uri = `hive://sign/${splat}${buildSearchParams(query)}`;
  let decoded: DecodeResult | null = null;
  try {
    decoded = decode(uri);
  } catch {
    decoded = legacyToHiveUri(splat, query);
  }

  const rawOps = decoded?.tx?.operations;
  if (!decoded || !Array.isArray(rawOps) || rawOps.length === 0) return null;

  try {
    const operations: Operation[] = rawOps.map(([name, payload]) => {
      const schema = OPERATIONS[name];
      if (!schema) throw new Error(`Unknown operation '${name}'`);
      const processed: Record<string, unknown> = {};
      for (const key of Object.keys(schema.schema)) {
        processed[key] = processValue(
          schema.schema[key],
          payload[key],
          vestsToSP,
        );
      }
      return [name, processed];
    });
    return {
      operations,
      callback: decoded.params.callback,
      noBroadcast: decoded.params.no_broadcast === true,
      signer: decoded.params.signer,
    };
  } catch {
    return null;
  }
}
