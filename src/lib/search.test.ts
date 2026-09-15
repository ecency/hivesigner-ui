import { describe, expect, it } from 'vitest';
import { parseSearch, stringifySearch } from './search';

describe('parseSearch', () => {
  it('keeps every value a string (no JSON coercion)', () => {
    const s = parseSearch('?weight=0&memo="hi"&json={"a":1}&author=alice');
    expect(s).toEqual({
      weight: '0', // NOT the number 0 -> an unvote stays an unvote
      memo: '"hi"', // quotes preserved
      json: '{"a":1}', // still a string, not an object
      author: 'alice',
    });
  });

  it('handles a leading ? or its absence', () => {
    expect(parseSearch('a=b')).toEqual({ a: 'b' });
    expect(parseSearch('?a=b')).toEqual({ a: 'b' });
    expect(parseSearch('')).toEqual({});
  });
});

describe('stringifySearch round-trip', () => {
  it('re-parses to the same strings', () => {
    const original = { weight: '0', memo: 'a — b', author: 'alice' };
    expect(parseSearch(stringifySearch(original))).toEqual(original);
  });

  it('returns an empty string for no params', () => {
    expect(stringifySearch({})).toBe('');
  });
});
