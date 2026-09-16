import { describe, expect, it } from 'vitest';
import {
  isKnownOperation,
  normalizeOperationName,
  OPERATIONS,
} from './operations';

describe('operation table', () => {
  it('carries every supported operation by its chain name', () => {
    expect(Object.keys(OPERATIONS)).toHaveLength(41);
    for (const name of [
      'vote',
      'escrow_transfer',
      'escrow_release',
      'account_create_with_delegation',
      'request_account_recovery',
      'recover_account',
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
