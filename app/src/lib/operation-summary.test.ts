import { describe, expect, it } from 'vitest';
import {
  type Operation,
  operationAuthority,
  requiredAuthority,
  summarizeOperation,
} from './operation-summary';

describe('summarizeOperation', () => {
  it('renders a transfer with amount, recipient and memo', () => {
    const op: Operation = [
      'transfer',
      { from: 'alice', to: 'bob', amount: '10.000 HIVE', memo: 'thanks' },
    ];
    expect(summarizeOperation(op)).toEqual({
      title: 'Send 10.000 HIVE to @bob',
      detail: 'Memo: thanks',
      authority: 'active',
    });
  });

  it('omits the memo line when empty', () => {
    const op: Operation = [
      'transfer',
      { to: 'bob', amount: '1.000 HIVE', memo: '' },
    ];
    expect(summarizeOperation(op).detail).toBeUndefined();
  });

  it('renders a vote as an upvote with percentage', () => {
    const op: Operation = [
      'vote',
      { voter: 'alice', author: 'ecency', permlink: 'x', weight: 10000 },
    ];
    const s = summarizeOperation(op);
    expect(s.title).toBe('Upvote @ecency/x');
    expect(s.detail).toBe('100%');
  });

  it('reads a negative weight as a downvote', () => {
    const op: Operation = [
      'vote',
      { author: 'ecency', permlink: 'x', weight: -5000 },
    ];
    expect(summarizeOperation(op).title).toBe('Downvote @ecency/x');
    expect(summarizeOperation(op).detail).toBe('-50%');
  });

  it('distinguishes a reply from a new post', () => {
    const post: Operation = [
      'comment',
      { parent_author: '', title: 'Hello', permlink: 'hello' },
    ];
    const reply: Operation = [
      'comment',
      { parent_author: 'bob', parent_permlink: 'p', permlink: 're' },
    ];
    expect(summarizeOperation(post).title).toBe('Publish post "Hello"');
    expect(summarizeOperation(reply).title).toBe('Reply to @bob/p');
  });

  it('falls back to a readable title for an unmapped operation', () => {
    expect(summarizeOperation(['claim_reward_balance', {}]).title).toBe(
      'Claim reward balance',
    );
  });
});

describe('authority resolution', () => {
  it('requires active for a transfer and posting for a vote', () => {
    expect(operationAuthority(['transfer', {}])).toBe('active');
    expect(operationAuthority(['vote', {}])).toBe('posting');
  });

  it('custom_json needs active only when required_auths is non-empty', () => {
    expect(
      operationAuthority(['custom_json', { required_auths: [], id: 'x' }]),
    ).toBe('posting');
    expect(
      operationAuthority([
        'custom_json',
        { required_auths: ['alice'], id: 'x' },
      ]),
    ).toBe('active');
  });

  it('returns a single authority when every op agrees, null when mixed', () => {
    expect(
      requiredAuthority([
        ['vote', { weight: 1 }],
        ['comment', { parent_author: '' }],
      ]),
    ).toBe('posting');
    expect(
      requiredAuthority([
        ['vote', { weight: 1 }],
        ['transfer', { to: 'bob' }],
      ]),
    ).toBeNull();
  });

  it('reads schema-listed privileged ops from the schema, not a default', () => {
    expect(operationAuthority(['transfer_from_savings', {}])).toBe('active');
    expect(operationAuthority(['change_recovery_account', {}])).toBe('owner');
  });

  it('returns null for an operation absent from the schema, not posting', () => {
    expect(operationAuthority(['made_up_op', {}])).toBeNull();
  });

  it('is null for a transaction containing an unknown-authority op', () => {
    expect(
      requiredAuthority([
        ['vote', { weight: 1 }],
        ['made_up_op', {}],
      ]),
    ).toBeNull();
  });
});
