import { describe, expect, it } from 'vitest';
import { processValue } from './process-value';

describe('processValue', () => {
  it('formats HIVE and HBD to three decimals', () => {
    expect(processValue({ type: 'amount' }, '10 HIVE', 1)).toBe('10.000 HIVE');
    expect(processValue({ type: 'amount' }, '1.5 HBD', 1)).toBe('1.500 HBD');
  });

  it('formats VESTS to six decimals and converts HP through vestsToSP', () => {
    expect(processValue({ type: 'amount' }, '3 VESTS', 1)).toBe(
      '3.000000 VESTS',
    );
    // 1 HP at 2 SP-per-VEST -> 0.5 VESTS
    expect(processValue({ type: 'amount' }, '1 HP', 2)).toBe('0.500000 VESTS');
  });

  it('parses ints and falls back to the default when empty', () => {
    expect(processValue({ type: 'int' }, '42', 1)).toBe(42);
    expect(processValue({ type: 'int', defaultValue: 10000 }, '', 1)).toBe(
      10000,
    );
  });

  it('coerces bool strings', () => {
    expect(processValue({ type: 'bool' }, 'false', 1)).toBe(false);
    expect(processValue({ type: 'bool' }, 'true', 1)).toBe('true');
  });

  it('truncates a string to maxLength - 1', () => {
    expect(processValue({ type: 'string', maxLength: 5 }, 'abcdefgh', 1)).toBe(
      'abcd',
    );
  });

  it('applies a default when the value is empty', () => {
    expect(
      processValue({ type: 'account', defaultValue: '__signer' }, '', 1),
    ).toBe('__signer');
  });
});
