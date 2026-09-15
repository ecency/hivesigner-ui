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
  type UnresolvedTx,
} from './hive-uri';
import { OPERATIONS } from './operations';
import { processValue } from './process-value';

export interface SignRequest {
  operations: Operation[];
  callback?: string;
  noBroadcast: boolean;
  signer?: string;
  /**
   * True when an amount field held an HP value, so the rendered/broadcast VESTS
   * depends on the live SP-per-VEST rate. The UI must not approve such a request
   * until a real rate has loaded (a fallback rate would submit the wrong VESTS).
   */
  hpDependent: boolean;
  /**
   * The original decoded transaction for a `/sign/tx/<b64>` request (which
   * carries the caller's own ref_block/expiration). When set, signing must
   * preserve it exactly - not rebuild - so the signature matches the caller's
   * transaction id. Absent for the op/ops/legacy forms.
   */
  preservedTx?: UnresolvedTx;
}

/**
 * A callback is usable only if it is an http(s) URL. A `javascript:` (or other
 * scheme) callback must never reach window.location.assign - dropping it here
 * means no redirect happens for such a request (defense in depth beyond the CSP).
 */
function safeCallback(cb: string | undefined): string | undefined {
  if (!cb) return undefined;
  try {
    const u = new URL(cb);
    return u.protocol === 'https:' || u.protocol === 'http:' ? cb : undefined;
  } catch {
    return undefined;
  }
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

  // Refuse a transaction carrying extensions rather than signing around them.
  // They ARE part of the signed digest but have no display, so signing one would
  // put bytes the user never saw under their key; silently emptying them instead
  // would hand a co-signer a signature over a different transaction than the one
  // they built. Hive defines no value-bearing transaction extension today, so
  // failing closed costs nothing and keeps both properties.
  if (
    Array.isArray(decoded.tx?.extensions) &&
    decoded.tx.extensions.length > 0
  ) {
    return null;
  }

  try {
    let hpDependent = false;
    const operations: Operation[] = rawOps.map(([name, payload]) => {
      const schema = OPERATIONS[name];
      if (!schema) throw new Error(`Unknown operation '${name}'`);
      const processed: Record<string, unknown> = {};
      for (const key of Object.keys(schema.schema)) {
        // Detect an HP amount on the RAW value (processValue converts it away).
        if (
          schema.schema[key].type === 'amount' &&
          String(payload[key] ?? '').includes('HP')
        ) {
          hpDependent = true;
        }
        const value = processValue(schema.schema[key], payload[key], vestsToSP);
        // Refuse a non-finite number instead of passing it on. parseInt('abc')
        // is NaN, and the serializer's DataView.setInt16(NaN) writes 0: a
        // `/sign/vote?weight=abc` displayed as "Upvote ... NaN%" would have been
        // signed as weight 0, which REMOVES an existing vote. Same for
        // percent_hbd, orderid, recurrence and every other int field.
        if (typeof value === 'number' && !Number.isFinite(value)) {
          throw new Error(`Invalid numeric value for '${key}'`);
        }
        processed[key] = value;
      }
      return [name, processed];
    });
    // A `tx` form carries the caller's real ref_block_num (a number); op/ops use
    // the placeholder string. Preserve the original tx so signing keeps its id.
    const isTxForm = typeof decoded.tx.ref_block_num === 'number';
    return {
      // Honour `cb` (any form) and fall back to a `redirect_uri` query param
      // (the old page did this for every form, not only the legacy one), but
      // only when it is an http(s) URL.
      operations,
      callback: safeCallback(decoded.params.callback ?? query.redirect_uri),
      noBroadcast: decoded.params.no_broadcast === true,
      signer: decoded.params.signer,
      hpDependent,
      preservedTx: isTxForm ? decoded.tx : undefined,
    };
  } catch {
    return null;
  }
}
