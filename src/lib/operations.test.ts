import { describe, expect, it } from 'vitest';
import {
  isKnownOperation,
  normalizeOperationName,
  OPERATIONS,
} from './operations';

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
    // Own properties only: these are on every object's prototype.
    for (const bad of ['toString', 'constructor', '__proto__', 'valueOf'])
      expect(isKnownOperation(bad), bad).toBe(false);
  });
});

describe('normalizeOperationName', () => {
  it('maps the legacy camelCase and kebab-case spellings onto the table', () => {
    expect(normalizeOperationName('transferToVesting')).toBe(
      'transfer_to_vesting',
    );
    expect(normalizeOperationName('transfer-to-vesting')).toBe(
      'transfer_to_vesting',
    );
    expect(normalizeOperationName('update_proposal_votes')).toBe(
      'update_proposal_votes',
    );
    expect(normalizeOperationName('Vote')).toBe('vote');
  });
});
