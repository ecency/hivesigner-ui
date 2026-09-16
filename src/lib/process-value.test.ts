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

  it('preserves a numeric zero instead of applying the default', () => {
    // An encoded unvote decodes weight as the number 0; it must not become 10000.
    expect(processValue({ type: 'int', defaultValue: 10000 }, 0, 1)).toBe(0);
    expect(processValue({ type: 'int', defaultValue: 10000 }, '0', 1)).toBe(0);
  });

  it('coerces bool strings to real booleans', () => {
    // Search params are raw strings, so every one of these reaches the
    // serializer. A truthy string would serialize as TRUE: "0" and "false" on a
    // witness-vote `approve` would have flipped an unvote into a vote.
    expect(processValue({ type: 'bool' }, 'false', 1)).toBe(false);
    expect(processValue({ type: 'bool' }, 'true', 1)).toBe(true);
    expect(processValue({ type: 'bool' }, '0', 1)).toBe(false);
    expect(processValue({ type: 'bool' }, '1', 1)).toBe(true);
    expect(processValue({ type: 'bool' }, 'False', 1)).toBe(false);
    expect(processValue({ type: 'bool' }, false, 1)).toBe(false);
    expect(processValue({ type: 'bool' }, true, 1)).toBe(true);
    // A missing value still takes the schema default.
    expect(processValue({ type: 'bool', defaultValue: true }, '', 1)).toBe(
      true,
    );
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

// Structured fields. The Nuxt util passed these through untouched, and so did
// the first port: `/sign/update_proposal_votes?proposal_ids=379` reached the
// node as a scalar and failed with "Invalid cast from string_type to Array".
describe('processValue — array, object, json, time', () => {
  const arr = { type: 'array' as const };

  it('turns a bare id, a JSON list and a comma list into an array of numbers', () => {
    expect(processValue(arr, '379', 1)).toEqual([379]);
    expect(processValue(arr, 379, 1)).toEqual([379]);
    expect(processValue(arr, '[379, 380]', 1)).toEqual([379, 380]);
    expect(processValue(arr, '379,380', 1)).toEqual([379, 380]);
    expect(processValue(arr, ['379'], 1)).toEqual([379]);
  });

  it('keeps account names and objects inside a list as they are', () => {
    expect(processValue(arr, '["alice","bob"]', 1)).toEqual(['alice', 'bob']);
    expect(processValue(arr, 'alice,bob', 1)).toEqual(['alice', 'bob']);
    expect(processValue(arr, [{ a: 1 }], 1)).toEqual([{ a: 1 }]);
  });

  it('applies an array default and leaves an absent required list absent', () => {
    expect(processValue({ ...arr, defaultValue: [] as never }, '', 1)).toEqual(
      [],
    );
    expect(processValue(arr, undefined, 1)).toBeUndefined();
  });

  it('refuses an object where a list is required', () => {
    expect(() => processValue(arr, '{"a":1}', 1)).toThrow();
    expect(() => processValue(arr, { a: 1 }, 1)).toThrow();
  });

  it('parses an object field from JSON text and refuses anything else', () => {
    const obj = { type: 'object' as const };
    expect(processValue(obj, '{"weight_threshold":1}', 1)).toEqual({
      weight_threshold: 1,
    });
    expect(processValue(obj, { x: 1 }, 1)).toEqual({ x: 1 });
    expect(() => processValue(obj, '[1]', 1)).toThrow();
    expect(() => processValue(obj, 'nope', 1)).toThrow();
    // Optional (account_update.owner): absent stays absent, never {}.
    expect(processValue(obj, undefined, 1)).toBeUndefined();
  });

  it('keeps a json field as text, validates it, and serializes a structured value', () => {
    const json = { type: 'json' as const };
    expect(processValue(json, '{"app":"x"}', 1)).toBe('{"app":"x"}');
    expect(processValue(json, { app: 'x' }, 1)).toBe('{"app":"x"}');
    expect(processValue({ ...json, defaultValue: '' }, '', 1)).toBe('');
    expect(() => processValue(json, '{not json', 1)).toThrow();
  });

  it('passes time and account through as strings', () => {
    expect(processValue({ type: 'time' }, '2030-01-01T00:00:00', 1)).toBe(
      '2030-01-01T00:00:00',
    );
    expect(processValue({ type: 'account' }, 'alice', 1)).toBe('alice');
  });
});

// The serializer WRAPS integers rather than refusing them, so a value outside
// its field's type was signed as a different number than the screen showed:
// recurrence 65560 as 24, weight 40000 as -25536, orderid 4294967296 as 0.
describe('processValue — integers stay inside the range the chain serializes', () => {
  const int = { type: 'int' as const };
  it('refuses out-of-range values per field, and accepts the edges', () => {
    expect(() => processValue(int, '65560', 1, 'recurrence')).toThrow(/range/);
    expect(processValue(int, '65535', 1, 'recurrence')).toBe(65535);
    expect(() => processValue(int, '40000', 1, 'weight')).toThrow(/range/);
    expect(processValue(int, '-10000', 1, 'weight')).toBe(-10000);
    expect(() => processValue(int, '4294967296', 1, 'orderid')).toThrow(
      /range/,
    );
    expect(processValue(int, '4294967295', 1, 'orderid')).toBe(4294967295);
    expect(() => processValue(int, '70000', 1, 'percent_hbd')).toThrow(/range/);
    expect(() => processValue(int, '-1', 1, 'executions')).toThrow(/range/);
    expect(() => processValue(int, '3000000000', 1, 'unknown_int')).toThrow(
      /range/,
    );
  });
  it('refuses anything that is not written as an integer', () => {
    for (const bad of ['12abc', '1e3', '1.5', '', 'abc', '0x10']) {
      expect(
        () =>
          processValue(
            { ...int, defaultValue: undefined },
            bad || 'x',
            1,
            'weight',
          ),
        bad,
      ).toThrow();
    }
    expect(processValue(int, ' 42 ', 1, 'weight')).toBe(42);
    expect(processValue(int, 7, 1, 'weight')).toBe(7);
  });
  it('refuses an amount that is not a number instead of formatting NaN', () => {
    expect(() => processValue({ type: 'amount' }, 'abc HIVE', 1)).toThrow(
      /amount/,
    );
    expect(processValue({ type: 'amount' }, '1 HIVE', 1)).toBe('1.000 HIVE');
  });
});

describe('proposal id lists', () => {
  it('range-checks every element like the scalar proposal_id, and refuses an unsafe id', () => {
    const arr = { type: 'array' as const };
    expect(processValue(arr, '[379, "380"]', 1, 'proposal_ids')).toEqual([
      379, 380,
    ]);
    expect(() =>
      processValue(arr, '[9007199254740993]', 1, 'proposal_ids'),
    ).toThrow(/range/);
    expect(() =>
      processValue(arr, '9007199254740993', 1, 'proposal_ids'),
    ).toThrow(/range/);
    expect(() => processValue(arr, '[-1]', 1, 'proposal_ids')).toThrow(/range/);
    expect(() => processValue(arr, [2 ** 53], 1, 'proposal_ids')).toThrow(
      /range/,
    );
    // Other lists: digits become safe integers, names stay names.
    expect(processValue(arr, 'alice,bob', 1, 'required_auths')).toEqual([
      'alice',
      'bob',
    ]);
    expect(() =>
      processValue(arr, '[99999999999999999999]', 1, 'extensions'),
    ).toThrow(/safe/);
  });
});
