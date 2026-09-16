import { describe, expect, it } from 'vitest';
import { isKnownOperation, OPERATIONS } from './operations';

describe('operation table', () => {
  it('carries the 34 operations the Nuxt app signed, by their chain names', () => {
    expect(Object.keys(OPERATIONS)).toHaveLength(34);
    for (const name of [
      'vote',
      'comment',
      'transfer',
      'custom_json',
      'update_proposal_votes',
    ]) {
      expect(isKnownOperation(name), name).toBe(true);
    }
    expect(isKnownOperation('not_an_op')).toBe(false);
    expect(isKnownOperation('transferToVesting')).toBe(false);
  });
});
