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
  const realValue =
    !value && typeof defaultValue !== 'undefined' ? defaultValue : value;

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
    case 'bool':
      if (value === 'false' || value === false) return false;
      return realValue as boolean;
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
