// Port of the Nuxt app's process-value.util: normalize one operation field
// against its schema entry. Kept faithful, including the quirks the parity
// suite pins (amounts formatted to fixed decimals, HP converted to VESTS,
// strings truncated to maxLength - 1).
//
// STRUCTURED TYPES ARE COERCED HERE, and nowhere else. The Nuxt util passed
// `array`, `object`, `json` and `time` through untouched, and so did the first
// port, which is how `/sign/update_proposal_votes?proposal_ids=379` reached
// the node as a scalar and came back as "Invalid cast from string_type to
// Array". Every entry point (legacy URL, encoded op, the /signs builder) ends
// up in this function, so this is the one place a field can be made to match
// the type the chain will serialize.
import type { OperationField } from './operations';

/**
 * The integer range each int field is SERIALIZED into. The SDK's serializer
 * wraps rather than throws, so a value outside its type came back on chain as
 * a different number than the confirm screen showed: recurrence 65560 signed
 * as 24, weight 40000 as -25536, orderid 4294967296 as 0. Every int field the
 * schema has is listed; anything else gets int32.
 */
const INT_RANGE: Record<string, [number, number]> = {
  weight: [-10000, 10000], // vote weight, int16 on chain, ±100.00%
  percent: [0, 10000], // set_withdraw_vesting_route, uint16 as basis points
  percent_hbd: [0, 10000], // comment_options
  recurrence: [0, 65535], // recurrent_transfer, uint16 hours
  executions: [0, 65535], // recurrent_transfer, uint16
  request_id: [0, 4294967295], // savings, uint32
  requestid: [0, 4294967295], // convert, uint32
  orderid: [0, 4294967295], // limit orders, uint32
  proposal_id: [0, Number.MAX_SAFE_INTEGER], // int64
};
const INT32: [number, number] = [-2147483648, 2147483647];

/** An integer written as digits only, inside the field's range. */
function toInt(value: unknown, fieldName?: string): number {
  const text = String(value).trim();
  // Digits only: "12abc" and "1e3" parsed to 12 and 1 and were signed as such.
  if (!/^-?\d+$/.test(text)) throw new Error(`not an integer: ${text}`);
  const n = Number(text);
  const [min, max] = (fieldName && INT_RANGE[fieldName]) || INT32;
  if (!Number.isSafeInteger(n) || n < min || n > max) {
    throw new Error(`out of range for ${fieldName ?? 'int'}: ${text}`);
  }
  return n;
}

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

/** A list element: an integer written as text becomes a number (proposal
 * ids), anything else is kept. Account names cannot be all digits, so an
 * account list is never touched by this. */
function listElement(v: unknown): unknown {
  return typeof v === 'string' && /^-?\d+$/.test(v.trim())
    ? Number(v.trim())
    : v;
}

/**
 * Anything a caller might write for an `array` field, as an array:
 * a JSON list, a bare scalar (`379`), a comma-separated list (`379,380`),
 * or an actual array from an encoded op.
 */
function toArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value.map(listElement);
  if (typeof value === 'number' || typeof value === 'boolean') return [value];
  if (typeof value === 'string') {
    const s = value.trim();
    if (s === '') return [];
    try {
      const parsed: unknown = JSON.parse(s);
      if (Array.isArray(parsed)) return parsed.map(listElement);
      if (typeof parsed === 'number' || typeof parsed === 'string') {
        return [listElement(parsed)];
      }
      if (isPlainObject(parsed)) throw new Error('expected a list');
    } catch (e) {
      if (e instanceof Error && e.message === 'expected a list') throw e;
      // Not JSON: a bare word or a comma-separated list.
    }
    return s
      .split(',')
      .map((x) => x.trim())
      .filter((x) => x !== '')
      .map(listElement);
  }
  throw new Error('expected a list');
}

/** An `object` field: a plain object, or JSON text that parses to one. */
function toObject(value: unknown): Record<string, unknown> {
  if (isPlainObject(value)) return value;
  if (typeof value === 'string') {
    let parsed: unknown;
    try {
      parsed = JSON.parse(value);
    } catch {
      throw new Error('expected a JSON object');
    }
    if (isPlainObject(parsed)) return parsed;
  }
  throw new Error('expected a JSON object');
}

/**
 * A `json` field (custom_json.json, json_metadata): the chain wants a STRING
 * holding JSON, so text is kept as text but must parse, and a structured value
 * from an encoded op is serialized. An empty string stays empty: that is the
 * documented way to clear json_metadata.
 */
function toJsonText(value: unknown): string {
  if (typeof value === 'string') {
    if (value.trim() === '') return value;
    try {
      JSON.parse(value);
    } catch {
      throw new Error('expected JSON text');
    }
    return value;
  }
  if (isPlainObject(value) || Array.isArray(value))
    return JSON.stringify(value);
  throw new Error('expected JSON text');
}

export function processValue(
  field: OperationField,
  value: unknown,
  vestsToSP: number,
  fieldName?: string,
): unknown {
  const { type, defaultValue, maxLength } = field;
  // Apply the default only for a genuinely missing value. A plain `!value` here
  // treats numeric 0 (and false) as missing, so an encoded weight:0 unvote was
  // replaced by the 10000 default and became a full upvote.
  const missing = value === undefined || value === null || value === '';
  const realValue =
    missing && typeof defaultValue !== 'undefined' ? defaultValue : value;

  // Still missing after the default: leave it absent. account_update's
  // owner/active/posting are OPTIONAL objects, and inventing {} for one made
  // the request escalate to the owner key with an empty authority.
  if (realValue === undefined || realValue === null) return realValue;

  switch (type) {
    case 'amount': {
      const s = String(realValue);
      const n = Number.parseFloat(s);
      // "abc HIVE" parsed to NaN and the screen read "Send NaN HIVE" over an
      // enabled Approve; the serializer would have refused it, but the screen
      // is the contract. Refuse here.
      if (!Number.isFinite(n)) throw new Error(`not an amount: ${s}`);
      if (s.includes('VESTS')) return `${n.toFixed(6)} VESTS`;
      if (s.includes('HP')) return `${(n / vestsToSP).toFixed(6)} VESTS`;
      if (s.includes('HIVE')) return `${n.toFixed(3)} HIVE`;
      if (s.includes('HBD')) return `${n.toFixed(3)} HBD`;
      return s;
    }
    case 'int':
      return toInt(realValue, fieldName);
    case 'bool': {
      // Search params are raw STRINGS (lib/search.ts keeps them unparsed), so a
      // cast would leave "true"/"0" as truthy strings and the serializer would
      // write TRUE for both. Convert to an actual boolean.
      if (typeof realValue === 'boolean') return realValue;
      const s = String(realValue).trim().toLowerCase();
      return !(s === 'false' || s === '0' || s === '' || s === 'no');
    }
    case 'string':
      if (maxLength) {
        const s = String(realValue);
        return s.substring(0, Math.min(s.length, maxLength - 1));
      }
      return String(realValue);
    case 'array':
      return toArray(realValue);
    case 'object':
      return toObject(realValue);
    case 'json':
      return toJsonText(realValue);
    case 'account':
    case 'time':
      return String(realValue);
    default:
      return realValue;
  }
}
