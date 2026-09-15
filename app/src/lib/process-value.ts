// Port of the Nuxt app's process-value.util: normalize one operation field
// against its schema entry. Kept faithful, including the quirks the parity
// suite pins (amounts formatted to fixed decimals, HP converted to VESTS,
// strings truncated to maxLength - 1).
import type { OperationField } from './operations';

export function processValue(
  field: OperationField,
  value: unknown,
  vestsToSP: number,
): string | number | boolean {
  const { type, defaultValue, maxLength } = field;
  // Apply the default only for a genuinely missing value. A plain `!value` here
  // treats numeric 0 (and false) as missing, so an encoded weight:0 unvote was
  // replaced by the 10000 default and became a full upvote.
  const missing = value === undefined || value === null || value === '';
  const realValue =
    missing && typeof defaultValue !== 'undefined' ? defaultValue : value;

  switch (type) {
    case 'amount': {
      const s = String(realValue);
      if (s.includes('VESTS'))
        return `${Number.parseFloat(s).toFixed(6)} VESTS`;
      if (s.includes('HP'))
        return `${(Number.parseFloat(s) / vestsToSP).toFixed(6)} VESTS`;
      if (s.includes('HIVE')) return `${Number.parseFloat(s).toFixed(3)} HIVE`;
      if (s.includes('HBD')) return `${Number.parseFloat(s).toFixed(3)} HBD`;
      return s;
    }
    case 'int':
      return Number.parseInt(String(realValue), 10);
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
      return realValue as string;
    default:
      return realValue as string;
  }
}
