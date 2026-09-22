import type { Account } from '@/lib/hive';
import {
  appDisplayName,
  profileForEditing,
  registeredCallbacks,
  saysItIsAnApp,
} from './app-profile';

// Hive keeps two metadata fields and the readers disagree about them: the API
// picks ONE profile (the posting one once it has a version, the older one
// until then) while everything in this app has always read the posting copy.
// So each question is answered where its answer lives, rather than on one
// merged object that is wrong for two of the three.

const account = (posting: unknown, json?: unknown): Account =>
  ({
    name: 'myapp',
    posting_json_metadata: JSON.stringify({ profile: posting }),
    ...(json === undefined
      ? {}
      : { json_metadata: JSON.stringify({ profile: json }) }),
  }) as unknown as Account;

describe('saysItIsAnApp', () => {
  it('takes the account at its word in either copy', () => {
    expect(saysItIsAnApp(account({ type: 'app' }))).toBe(true);
    expect(saysItIsAnApp(account({ name: 'A' }, { type: 'app' }))).toBe(true);
  });

  it('ignores the older copy once the newer one carries a version', () => {
    // The API stops reading it there, so this app is already refused a code.
    expect(
      saysItIsAnApp(account({ version: 2, name: 'A' }, { type: 'app' })),
    ).toBe(false);
  });

  it('is false for an account that never said it', () => {
    expect(saysItIsAnApp(account({ name: 'A' }, { name: 'A' }))).toBe(false);
    expect(saysItIsAnApp(account({ type: 'user' }))).toBe(false);
    expect(saysItIsAnApp(null)).toBe(false);
  });
});

describe('registeredCallbacks', () => {
  it('uses the account own list', () => {
    expect(
      registeredCallbacks(
        account(
          { redirect_uris: ['https://a.example/cb'] },
          { redirect_uris: ['https://old.example/cb'] },
        ),
      ),
    ).toEqual(['https://a.example/cb']);
  });

  it('falls back to the older copy only when there is no list at all', () => {
    expect(
      registeredCallbacks(
        account({ type: 'app' }, { redirect_uris: ['https://old.example/cb'] }),
      ),
    ).toEqual(['https://old.example/cb']);
  });

  // Emptying the list is how a compromised callback is de-registered, and the
  // older copy is full of addresses owners have since dropped.
  it('does not bring back the older copy once the profile has a version', () => {
    expect(
      registeredCallbacks(
        account(
          { type: 'app', version: 2 },
          { redirect_uris: ['https://old.example/cb'] },
        ),
      ),
    ).toEqual([]);
  });

  it('keeps only strings', () => {
    expect(
      registeredCallbacks(
        account({ redirect_uris: ['https://a/cb', 7, null] }),
      ),
    ).toEqual(['https://a/cb']);
    expect(registeredCallbacks(account({ redirect_uris: 'nope' }))).toEqual([]);
  });
});

describe('profileForEditing', () => {
  it('lays the older copy under the newer one until it has a version', () => {
    expect(
      profileForEditing(
        account({ name: 'New' }, { name: 'Old', secret: 'a'.repeat(64) }),
      ),
    ).toEqual({ name: 'New', secret: 'a'.repeat(64) });
  });

  it('leaves a versioned profile alone', () => {
    expect(
      profileForEditing(account({ name: 'New', version: 2 }, { secret: 'x' })),
    ).toEqual({ name: 'New', version: 2 });
  });
});

describe('appDisplayName', () => {
  it('prefers the account own name, then the older copy, then the id', () => {
    expect(
      appDisplayName(account({ name: 'New' }, { name: 'Old' }), 'myapp'),
    ).toBe('New');
    expect(appDisplayName(account({}, { name: 'Old' }), 'myapp')).toBe('Old');
    expect(appDisplayName(account({ name: { a: 1 } }), 'myapp')).toBe('myapp');
  });
});
