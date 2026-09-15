import { describe, expect, it } from 'vitest';
import {
  type Operation,
  operationActors,
  operationAuthority,
  operationFields,
  requiredAuthority,
  summarizeOperation,
} from './operation-summary';
import { resolveSigner } from './sign-tx';

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

  it('labels a zero-weight vote as a removal, not a 0% upvote', () => {
    const s = summarizeOperation([
      'vote',
      { author: 'ecency', permlink: 'x', weight: 0 },
    ]);
    expect(s.title).toBe('Remove vote from @ecency/x');
    expect(s.detail).toBeUndefined();
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

  it('account_update needs owner for an owner change, active otherwise', () => {
    const owner = { weight_threshold: 1, account_auths: [], key_auths: [] };
    expect(
      operationAuthority(['account_update', { account: 'a', owner }]),
    ).toBe('owner');
    expect(
      operationAuthority([
        'account_update',
        { account: 'a', json_metadata: '{}' },
      ]),
    ).toBe('active');
  });

  it('account_update2 needs active for json_metadata, posting for a profile-only edit', () => {
    expect(
      operationAuthority([
        'account_update2',
        { account: 'a', json_metadata: '{"x":1}', posting_json_metadata: '' },
      ]),
    ).toBe('active');
    expect(
      operationAuthority([
        'account_update2',
        { account: 'a', json_metadata: '', posting_json_metadata: '{"p":1}' },
      ]),
    ).toBe('posting');
  });

  it('exposes the attacker key of an account_update as a visible field (anti-phishing)', () => {
    const rows = operationFields([
      'account_update',
      {
        account: 'victim',
        active: {
          weight_threshold: 1,
          account_auths: [],
          key_auths: [['STM_ATTACKER', 1]],
        },
      },
    ]);
    const activeRow = rows.find((r) => r.label === 'active authority');
    expect(activeRow?.value).toContain('STM_ATTACKER');
  });

  it('shows the json body of a custom_json and every field of an unmapped op', () => {
    const cj = operationFields([
      'custom_json',
      { id: 'ssc-mainnet-hive', json: '{"to":"attacker"}' },
    ]);
    expect(cj.find((r) => r.label === 'json.to')?.value).toBe('attacker');
    const unknown = operationFields(['some_new_op', { foo: 'bar', n: 5 }]);
    expect(unknown.map((r) => r.label)).toEqual(['foo', 'n']);
  });

  it('flattens every leaf of a custom_json so nothing is hidden past a cut', () => {
    // A long token-transfer payload: the harmful amount used to sit past the
    // 400-char inline truncation. Every leaf must now be its own visible row.
    const pad = 'x'.repeat(500);
    const json = JSON.stringify([
      'transfer',
      { note: pad, to: 'attacker', amount: '999.000 HIVE' },
    ]);
    const rows = operationFields(['custom_json', { id: 'sm', json }]);
    expect(rows.find((r) => r.label === 'json.[0]')?.value).toBe('transfer');
    expect(rows.find((r) => r.label === 'json.[1].to')?.value).toBe('attacker');
    expect(rows.find((r) => r.label === 'json.[1].amount')?.value).toBe(
      '999.000 HIVE',
    );
    // No row is truncated with an ellipsis.
    expect(rows.every((r) => !r.value.endsWith('…'))).toBe(true);
  });

  it('falls back to the WHOLE raw json when it does not parse', () => {
    // Long enough that the old 400-char truncation would have cut it, so this
    // test fails if the truncation ever comes back.
    const raw = `not json { ${'y'.repeat(600)}`;
    const rows = operationFields(['custom_json', { id: 'sm', json: raw }]);
    expect(rows.find((r) => r.label === 'json')?.value).toBe(raw);
  });

  it('renders the signer placeholder resolved, in the title as well as the rows', () => {
    // One resolver runs before display (the same one the signer uses), so NO
    // rendered string may still contain the raw placeholder.
    const json = '["follow",{"follower":"__signer","following":"bob"}]';
    const [op] = resolveSigner(
      [
        [
          'custom_json',
          { id: 'follow', required_posting_auths: ['__signer'], json },
        ],
      ],
      'alice',
    );
    const rows = operationFields(op);
    expect(rows.find((r) => r.label === 'Posting auths')?.value).toBe('alice');
    expect(rows.find((r) => r.label === 'json.[1].follower')?.value).toBe(
      'alice',
    );
    // The summary line is the most-read text on the screen: it must resolve too.
    const [transfer] = resolveSigner(
      [
        [
          'transfer',
          { from: '__signer', to: '__signer', amount: '1.000 HIVE' },
        ],
      ],
      'alice',
    );
    const s = summarizeOperation(transfer);
    expect(s.title).toBe('Send 1.000 HIVE to @alice');
    expect(s.title).not.toContain('__signer');
    expect(
      operationFields(transfer).every((r) => !r.value.includes('__signer')),
    ).toBe(true);
  });

  it('does not let a $ pattern in the signer name corrupt the substitution', () => {
    // `signer` can come from the caller-supplied `s` param, so a string
    // replacement would reinterpret $& / $1.
    const [op] = resolveSigner([['vote', { voter: '__signer' }]], '$&$&');
    expect(op[1].voter).toBe('$&$&');
  });

  it('shows the account_update weight_threshold so a lockout is not invisible', () => {
    const rows = operationFields([
      'account_update',
      {
        account: 'victim',
        owner: {
          weight_threshold: 9,
          account_auths: [],
          key_auths: [['STM_x', 1]],
        },
      },
    ]);
    expect(rows.find((r) => r.label === 'owner authority')?.value).toContain(
      'threshold 9',
    );
  });

  it('shows a threshold sent as a STRING, which the chain still signs as a number', () => {
    // The bypass: a typeof === 'number' check renders no threshold at all, so a
    // co-control authority looks identical to a no-op.
    const rows = operationFields([
      'account_update',
      {
        account: 'victim',
        posting: {
          weight_threshold: '2',
          account_auths: [['attacker', 1]],
          key_auths: [['STM_victim', 1]],
        },
      },
    ]);
    const row = rows.find((r) => r.label === 'posting authority')?.value;
    expect(row).toContain('threshold 2');
    expect(row).toContain('@attacker');
  });

  it('calls out a MISSING weight_threshold instead of omitting the row', () => {
    const rows = operationFields([
      'account_update',
      { account: 'victim', owner: { account_auths: [], key_auths: [] } },
    ]);
    expect(rows.find((r) => r.label === 'owner authority')?.value).toContain(
      'NOT SET',
    );
  });

  it('flattens account metadata instead of describing it, so a redirect_uris rewrite is visible', () => {
    // posting_json_metadata carries `profile.redirect_uris`, which the OAuth
    // screen trusts as an app's registered callbacks. "profile metadata changes"
    // hid the whole payload.
    const rows = operationFields([
      'account_update2',
      {
        account: 'victim',
        posting_json_metadata: JSON.stringify({
          profile: { redirect_uris: ['https://attacker.example/cb'] },
        }),
      },
    ]);
    expect(
      rows.find((r) => r.label === 'Profile.profile.redirect_uris[0]')?.value,
    ).toBe('https://attacker.example/cb');
  });

  it('names the account an operation acts AS, so signing for another account is not silent', () => {
    // The user co-manages @treasury; without a From row this reads as their own
    // 10 HIVE. `s` never covered this case.
    const rows = operationFields([
      'transfer',
      { from: 'treasury', to: 'attacker', amount: '10.000 HIVE' },
    ]);
    expect(rows.find((r) => r.label === 'From')?.value).toBe('@treasury');
    expect(operationActors(['transfer', { from: 'treasury' }])).toEqual([
      'treasury',
    ]);
    expect(operationActors(['vote', { voter: 'alice' }])).toEqual(['alice']);
    expect(
      operationActors(['custom_json', { required_posting_auths: ['alice'] }]),
    ).toEqual(['alice']);
  });

  it('strips bidi and control characters that make a value read as something else', () => {
    // U+202E (RLO) visually reverses the text that follows it.
    const s = summarizeOperation([
      'transfer',
      { to: 'bob', amount: '1.000 HIVE', memo: 'pay ‮0001 ot' },
    ]);
    expect(s.detail).not.toContain('‮');
    const rows = operationFields([
      'custom_json',
      { id: 'x', json: JSON.stringify({ note: 'a​b\nc' }) },
    ]);
    const note = rows.find((r) => r.label === 'json.note')?.value ?? '';
    expect(note).not.toContain('​');
    expect(note).not.toContain('\n');
  });

  it('distinguishes JSON leaves that would otherwise render as the same path', () => {
    const rows = operationFields([
      'custom_json',
      {
        id: 'x',
        json: JSON.stringify({
          contractPayload: { to: 'friend' },
          'contractPayload.to': 'attacker',
        }),
      },
    ]);
    const labels = rows.map((r) => r.label);
    expect(new Set(labels).size).toBe(labels.length);
    expect(rows.find((r) => r.value === 'attacker')?.label).not.toBe(
      rows.find((r) => r.value === 'friend')?.label,
    );
  });

  it('renders null and empty containers as themselves, not as blank or nothing', () => {
    const rows = operationFields([
      'custom_json',
      { id: 'x', json: JSON.stringify({ n: null, e: {}, a: [], s: '' }) },
    ]);
    expect(rows.find((r) => r.label === 'json.n')?.value).toBe('null');
    expect(rows.find((r) => r.label === 'json.e')?.value).toBe('{}');
    expect(rows.find((r) => r.label === 'json.a')?.value).toBe('[]');
    expect(rows.find((r) => r.label === 'json.s')?.value).toBe('');
  });

  it('exposes a comment permlink, body and metadata (not just the title)', () => {
    const rows = operationFields([
      'comment',
      {
        parent_author: '',
        parent_permlink: 'hive-123',
        author: 'alice',
        permlink: 'my-post',
        title: 'Hello',
        body: 'the full body text',
        json_metadata: '{"app":"x"}',
      },
    ]);
    expect(rows.find((r) => r.label === 'Permlink')?.value).toBe('my-post');
    expect(rows.find((r) => r.label === 'Community/tag')?.value).toBe(
      'hive-123',
    );
    expect(rows.find((r) => r.label === 'Body')?.value).toBe(
      'the full body text',
    );
    // Metadata is flattened, not summarised away.
    expect(rows.find((r) => r.label === 'Metadata.app')?.value).toBe('x');
  });

  it('returns no extra fields for a fully-summarized transfer/vote', () => {
    expect(
      operationFields(['transfer', { to: 'b', amount: '1.000 HIVE' }]),
    ).toEqual([]);
    expect(
      operationFields(['vote', { author: 'a', permlink: 'p', weight: 1 }]),
    ).toEqual([]);
  });

  it('account_update2 needs active for an active/posting/memo-key change, owner for an owner change', () => {
    const auth = { weight_threshold: 1, account_auths: [], key_auths: [] };
    expect(
      operationAuthority(['account_update2', { account: 'a', active: auth }]),
    ).toBe('active');
    expect(
      operationAuthority(['account_update2', { account: 'a', posting: auth }]),
    ).toBe('active');
    expect(
      operationAuthority([
        'account_update2',
        { account: 'a', memo_key: 'STM1' },
      ]),
    ).toBe('active');
    expect(
      operationAuthority(['account_update2', { account: 'a', owner: auth }]),
    ).toBe('owner');
  });
});
