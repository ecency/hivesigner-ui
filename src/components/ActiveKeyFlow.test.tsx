import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import i18n from '../i18n';
import { wholeText } from '../test-text';

// Which key a consent or grant screen needs, and what happens when the
// account on this device lacks it (#135). Unlike AuthorizeConsent.test, the
// account store, the credential check and the token are all REAL here: the
// point is that a key added in place reaches storage, re-renders the screen
// and is the key that signs. Only the chain is faked.
vi.mock('@tanstack/react-router', async () =>
  (await import('../test-router-mock')).routerMock(),
);
const chain = vi.hoisted(() => ({
  granted: false,
  getAccount: vi.fn(),
  broadcastOperations: vi.fn(),
  assign: vi.fn(),
}));
vi.mock('@/lib/hive', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/hive')>()),
  getAccount: chain.getAccount,
}));
vi.mock('@/lib/sign-tx', () => ({
  broadcastOperations: chain.broadcastOperations,
}));
vi.mock('@/lib/grant', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/grant')>()),
  // The real one sleeps 2s between chain reads.
  waitForGrant: async () => chain.granted,
}));
vi.mock('@/components/AppProfile', () => ({ AppProfile: () => null }));
vi.mock('@sentry/browser', () => ({
  captureFeedback: vi.fn(),
  getClient: () => undefined,
}));

import { PrivateKey } from '@ecency/sdk/hive';
import {
  _resetKeyCache,
  accountIsEncrypted,
  addAccount,
  getKeys,
  lockAccount,
  unlockAccount,
} from '@/lib/accounts';
import { decodeToken } from '@/lib/message-token';
import type { AuthRequest } from '@/lib/oauth';
import { AuthorizeConsent } from './AuthorizeConsent';
import { GrantAction } from './GrantAction';

const MASTER = 'P5-test-master-password';
const owner = PrivateKey.fromLogin('alice', MASTER, 'owner');
const active = PrivateKey.fromLogin('alice', MASTER, 'active');
const posting = PrivateKey.fromLogin('alice', MASTER, 'posting');
const memo = PrivateKey.fromLogin('alice', MASTER, 'memo');
// A second posting key on the account, not derived from the master password:
// the kind a user adds by hand and keeps on this device.
const posting2 = PrivateKey.fromSeed('alice-second-posting-key');
const pub = (k: PrivateKey) => k.createPublic().toString();

const appAccount = {
  name: 'ecency.app',
  posting_json_metadata: JSON.stringify({
    profile: {
      name: 'Ecency',
      type: 'app',
      redirect_uris: ['https://ecency.com/auth'],
    },
  }),
};
const alice = () => ({
  name: 'alice',
  owner: {
    weight_threshold: 1,
    account_auths: [],
    key_auths: [[pub(owner), 1]],
  },
  active: {
    weight_threshold: 1,
    account_auths: [],
    key_auths: [[pub(active), 1]],
  },
  posting: {
    weight_threshold: 1,
    account_auths: chain.granted ? [['ecency.app', 1]] : [],
    key_auths: [
      [pub(posting), 1],
      [pub(posting2), 1],
    ],
  },
  memo_key: pub(memo),
  posting_json_metadata: '{}',
});

function wrap(ui: ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>{ui}</QueryClientProvider>,
  );
}

function renderConsent(req: Partial<AuthRequest> = {}) {
  return wrap(
    <AuthorizeConsent
      req={{
        clientId: 'ecency.app',
        redirectUri: 'https://ecency.com/auth',
        scope: 'posting',
        responseType: 'code',
        ...req,
      }}
    />,
  );
}

const keyField = () =>
  // The label also wraps the hint, so its text is longer than the name.
  screen.getByLabelText(
    i18n.t('authorize.active_key_label', { account: '@alice' }),
    { exact: false },
  );
const addButton = () =>
  screen.getByRole('button', { name: i18n.t('authorize.add_active_key') });
const protectBox = () =>
  screen.getByRole('checkbox', {
    name: i18n.t('import.protect_with_passcode'),
  });
const newPasscode = () =>
  screen.getByLabelText(new RegExp(`^${i18n.t('import.passcode')}`));

beforeEach(() => {
  localStorage.clear();
  _resetKeyCache();
  chain.granted = false;
  chain.getAccount.mockReset();
  chain.getAccount.mockImplementation(async (name: string) =>
    name === 'ecency.app' ? appAccount : name === 'alice' ? alice() : null,
  );
  chain.broadcastOperations.mockReset();
  chain.broadcastOperations.mockImplementation(async () => {
    chain.granted = true;
    return { id: 'tx' };
  });
  chain.assign.mockReset();
  vi.stubGlobal('location', {
    assign: chain.assign,
    pathname: '/oauth2/authorize',
    search: '?client_id=ecency.app',
    origin: 'https://hivesigner.test',
  });
});

function issuedToken() {
  const url = new URL(chain.assign.mock.calls[0][0]);
  return decodeToken(url.searchParams.get('code') ?? '');
}

describe('consent with only an active key on this device', () => {
  it('logs in to an app that already holds the grant, signing the token with the active key', async () => {
    chain.granted = true;
    await addAccount('alice', { active: active.toString() });
    renderConsent();
    // Nothing new is granted, so it is a sign-in, not an authorization.
    const button = await screen.findByRole('button', { name: /^sign in$/i });
    await waitFor(() => expect(button).toBeEnabled());
    await userEvent.setup().click(button);
    await waitFor(() => expect(chain.assign).toHaveBeenCalledTimes(1));
    const token = issuedToken();
    expect(token?.signer).toBe(pub(active));
    expect(token?.payload.authority).toBe('active');
    expect(chain.broadcastOperations).not.toHaveBeenCalled();
  });

  it('grants a new app with the active key and issues the token', async () => {
    await addAccount('alice', { active: active.toString() });
    renderConsent();
    const button = await screen.findByRole('button', { name: /authorize/i });
    await waitFor(() => expect(button).toBeEnabled());
    await userEvent.setup().click(button);
    await waitFor(() => expect(chain.assign).toHaveBeenCalledTimes(1));
    expect(chain.broadcastOperations).toHaveBeenCalledWith(
      [expect.arrayContaining(['account_update'])],
      active.toString(),
      'alice',
    );
    expect(issuedToken()?.signer).toBe(pub(active));
  });
});

describe('consent with only a posting key on this device', () => {
  it('logs in to an app that already holds the grant with the posting key, asking for nothing', async () => {
    chain.granted = true;
    await addAccount('alice', { posting: posting.toString() });
    renderConsent();
    const button = await screen.findByRole('button', { name: /^sign in$/i });
    await waitFor(() => expect(button).toBeEnabled());
    expect(screen.queryByTestId('add-active-key')).toBeNull();
    await userEvent.setup().click(button);
    await waitFor(() => expect(chain.assign).toHaveBeenCalledTimes(1));
    expect(issuedToken()?.signer).toBe(pub(posting));
  });

  it('asks for the active key in place for a first-time grant, then grants with it and signs the token with posting', async () => {
    await addAccount('alice', { posting: posting.toString() });
    renderConsent();
    const user = userEvent.setup();
    await screen.findByTestId('add-active-key');
    // No Authorize to press yet: it would only fail.
    expect(screen.queryByRole('button', { name: /^authorize$/i })).toBeNull();
    expect(screen.getByText(/first-time authorization/i)).toBeInTheDocument();

    // Left unprotected only because the user unticks it.
    await user.click(protectBox());
    // The posting key is not the active key: refused, nothing stored.
    await user.type(keyField(), posting.toString());
    await user.click(addButton());
    expect(await screen.findByRole('alert')).toHaveTextContent(
      i18n.t('authorize.not_active_key', { account: '@alice' }),
    );
    expect(getKeys('alice')?.active).toBeUndefined();

    await user.clear(keyField());
    await user.type(keyField(), active.toString());
    await user.click(addButton());
    await screen.findByRole('button', { name: /^authorize$/i });
    expect(screen.queryByTestId('add-active-key')).toBeNull();
    expect(accountIsEncrypted('alice')).toBe(false);
    // Stored, not just held for this render: it survives a lock and unlock.
    lockAccount('alice');
    expect((await unlockAccount('alice')).active).toBe(active.toString());

    // The lock re-rendered the screen, so look the button up again.
    await user.click(
      await screen.findByRole('button', { name: /^authorize$/i }),
    );
    await waitFor(() => expect(chain.assign).toHaveBeenCalledTimes(1));
    expect(chain.broadcastOperations).toHaveBeenCalledTimes(1);
    expect(chain.broadcastOperations.mock.calls[0][1]).toBe(active.toString());
    expect(issuedToken()?.signer).toBe(pub(posting));
  });

  it('takes a master password but keeps only the active and posting keys from it', async () => {
    // Memo only, so the posting key can only have come from the password.
    await addAccount('alice', { memo: memo.toString() });
    renderConsent();
    const user = userEvent.setup();
    await screen.findByTestId('add-active-key');
    await user.type(keyField(), MASTER);
    await user.click(protectBox());
    await user.click(addButton());
    await screen.findByRole('button', { name: /^authorize$/i });
    const keys = getKeys('alice');
    expect(keys?.active).toBe(active.toString());
    expect(keys?.posting).toBe(posting.toString());
    expect(keys?.owner).toBeUndefined();
  });

  it('keeps the posting key already on the device when a master password derives a different one', async () => {
    await addAccount('alice', { posting: posting2.toString() });
    renderConsent();
    const user = userEvent.setup();
    await screen.findByTestId('add-active-key');
    await user.type(keyField(), MASTER);
    await user.click(protectBox());
    await user.click(addButton());
    await screen.findByRole('button', { name: /^authorize$/i });
    expect(getKeys('alice')?.active).toBe(active.toString());
    expect(getKeys('alice')?.posting).toBe(posting2.toString());
  });

  it('accepts a pasted key with surrounding whitespace', async () => {
    await addAccount('alice', { posting: posting.toString() });
    renderConsent();
    const user = userEvent.setup();
    await screen.findByTestId('add-active-key');
    await user.type(keyField(), `  ${active.toString()}  `);
    await user.click(protectBox());
    await user.click(addButton());
    await screen.findByRole('button', { name: /^authorize$/i });
    expect(getKeys('alice')?.active).toBe(active.toString());
  });

  it('adds nothing on Enter while the form is incomplete, and once while it works', async () => {
    await addAccount('alice', { posting: posting.toString() });
    renderConsent();
    const user = userEvent.setup();
    await screen.findByTestId('add-active-key');
    let lookups = 0;
    let release: (value: unknown) => void = () => {};
    chain.getAccount.mockImplementation(async (name: string) => {
      if (name !== 'alice') return appAccount;
      lookups += 1;
      await new Promise((r) => {
        release = r;
      });
      return alice();
    });
    // Protection is on and the new passcode is too short: Enter adds nothing,
    // where it used to store the key under it (or unprotected when empty).
    await user.type(keyField(), active.toString());
    await user.type(newPasscode(), 'ab{Enter}');
    await new Promise((r) => setTimeout(r, 50));
    expect(lookups).toBe(0);
    expect(getKeys('alice')?.active).toBeUndefined();
    // Nor when the form is submitted without its button, with no passcode:
    // an empty passcode would have stored the key unprotected.
    await user.clear(newPasscode());
    fireEvent.submit(screen.getByTestId('add-active-key'));
    await new Promise((r) => setTimeout(r, 50));
    expect(lookups).toBe(0);
    await user.type(newPasscode(), 'ab');
    // Complete, then Enter three times while the lookup is pending.
    await user.type(newPasscode(), 'cd{Enter}{Enter}{Enter}');
    await new Promise((r) => setTimeout(r, 50));
    expect(lookups).toBe(1);
    // Nothing can be typed over the emptied fields meanwhile.
    expect(keyField()).toHaveAttribute('readonly');
    expect(newPasscode()).toHaveAttribute('readonly');
    release(undefined);
    await screen.findByRole(
      'button',
      { name: /^authorize$/i },
      { timeout: 10_000 },
    );
    expect(getKeys('alice')?.active).toBe(active.toString());
  }, 30_000);

  it('protects an unprotected account with a new passcode by default', async () => {
    await addAccount('alice', { posting: posting.toString() });
    renderConsent();
    const user = userEvent.setup();
    await screen.findByTestId('add-active-key');
    expect(protectBox()).toBeChecked();
    expect(newPasscode()).toHaveAttribute('data-1p-ignore');
    await user.type(keyField(), active.toString());
    // No passcode yet, then one shorter than /import allows.
    expect(addButton()).toBeDisabled();
    await user.type(newPasscode(), 'abc');
    expect(addButton()).toBeDisabled();
    await user.type(newPasscode(), 'd');
    await user.click(addButton());
    await screen.findByRole(
      'button',
      { name: /^authorize$/i },
      { timeout: 10_000 },
    );
    // The whole record, posting key included, is now under the passcode.
    expect(accountIsEncrypted('alice')).toBe(true);
    lockAccount('alice');
    const reread = await unlockAccount('alice', 'abcd');
    expect(reread.active).toBe(active.toString());
    expect(reread.posting).toBe(posting.toString());
  }, 30_000);

  it('asks for the passcode of a protected account and keeps it protected', async () => {
    await addAccount('alice', { posting: posting.toString() }, 'pass1234');
    renderConsent();
    const user = userEvent.setup();
    await screen.findByTestId('add-active-key');
    const passcode = screen.getByLabelText(
      i18n.t('authorize.active_key_passcode', { account: '@alice' }),
      { exact: false },
    );
    // Password managers are told to leave both fields alone (#136).
    expect(passcode).toHaveAttribute('data-1p-ignore');
    expect(keyField()).toHaveAttribute('autocomplete', 'one-time-code');

    await user.type(keyField(), active.toString());
    await user.type(passcode, 'wrong-one');
    // Taken out of the fields while the key is being added (#136): read them
    // at the moment the account is looked up, after the submit started.
    const seen: string[] = [];
    chain.getAccount.mockImplementation(async (name: string) => {
      seen.push(
        (document.querySelector('input[name="active-key"]') as HTMLInputElement)
          .value,
        (
          document.querySelector(
            'input[name="unlock-passcode"]',
          ) as HTMLInputElement
        ).value,
      );
      return name === 'alice' ? alice() : appAccount;
    });
    await user.click(addButton());
    expect(
      await screen.findByRole('alert', {}, { timeout: 10_000 }),
    ).toHaveTextContent(i18n.t('authorize.wrong_passcode'));
    expect(getKeys('alice')?.active).toBeUndefined();
    expect(seen).toEqual(['', '']);
    // ... and given back when it was not added, so nothing is retyped.
    expect(keyField()).toHaveValue(active.toString());
    expect(passcode).toHaveValue('wrong-one');

    await user.clear(passcode);
    await user.type(passcode, 'pass1234');
    await user.click(addButton());
    await screen.findByRole(
      'button',
      { name: /^authorize$/i },
      { timeout: 10_000 },
    );
    expect(accountIsEncrypted('alice')).toBe(true);
    lockAccount('alice');
    const reread = await unlockAccount('alice', 'pass1234');
    expect(reread.active).toBe(active.toString());
    expect(reread.posting).toBe(posting.toString());
  }, 30_000);

  it('does not ask for a key on behalf of a callback the app never registered', async () => {
    await addAccount('alice', { posting: posting.toString() });
    renderConsent({ redirectUri: 'https://evil.example/auth' });
    const button = await screen.findByRole('button', { name: /^authorize$/i });
    expect(button).toBeDisabled();
    expect(screen.queryByTestId('add-active-key')).toBeNull();
  });

  it('does not ask for a key on behalf of an app account that does not exist, and says why', async () => {
    await addAccount('alice', { posting: posting.toString() });
    renderConsent({ clientId: 'ghost.app' });
    expect(
      await screen.findByText(
        wholeText(i18n.t('authorize.app_not_found', { app: '@ghost.app' })),
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^authorize$/i })).toBeDisabled();
    expect(screen.queryByTestId('add-active-key')).toBeNull();
  });

  it('offers a retry when the account cannot be read, then carries on', async () => {
    await addAccount('alice', { posting: posting.toString() });
    let down = true;
    chain.getAccount.mockImplementation(async (name: string) => {
      if (name === 'alice' && down) throw new Error('rpc down');
      return name === 'ecency.app' ? appAccount : alice();
    });
    renderConsent();
    expect(await screen.findByRole('alert')).toHaveTextContent(
      i18n.t('authorize.read_failed'),
    );
    expect(screen.queryByRole('button', { name: /^authorize$/i })).toBeNull();
    down = false;
    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: i18n.t('authorize.retry') }));
    expect(await screen.findByTestId('add-active-key')).toBeInTheDocument();
    expect(screen.queryByText(i18n.t('authorize.read_failed'))).toBeNull();
  });

  it('offers a retry when the app account cannot be read', async () => {
    await addAccount('alice', { posting: posting.toString() });
    let down = true;
    chain.getAccount.mockImplementation(async (name: string) => {
      if (name === 'ecency.app' && down) throw new Error('rpc down');
      return name === 'ecency.app' ? appAccount : alice();
    });
    renderConsent();
    await screen.findByText(i18n.t('authorize.read_failed'));
    expect(screen.queryByTestId('add-active-key')).toBeNull();
    down = false;
    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: i18n.t('authorize.retry') }));
    expect(await screen.findByTestId('add-active-key')).toBeInTheDocument();
  });
});

describe('a returning visit with a protected account (#145)', () => {
  const passcodeField = () =>
    screen.getByLabelText(i18n.t('accounts.passcode'));

  async function protectedAndLocked(keys: {
    posting?: string;
    active?: string;
  }) {
    await addAccount('alice', keys, 'correct-passcode');
    // A reload drops the keys from memory; the record stays encrypted.
    lockAccount('alice');
  }

  it('signs in to an app it already authorized with the passcode and one click', async () => {
    chain.granted = true;
    await protectedAndLocked({ posting: posting.toString() });
    renderConsent();
    const user = userEvent.setup();
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent(
      /sign in to/i,
    );
    // The scope was shown when it was granted; a sign-in names no abilities.
    expect(screen.queryAllByRole('listitem')).toHaveLength(0);
    const button = screen.getByRole('button', { name: /^sign in$/i });
    await waitFor(() => expect(button).toBeDisabled());
    // A sign-in: the passcode is the next thing to do.
    expect(passcodeField()).toHaveFocus();
    await user.type(passcodeField(), 'correct-passcode');
    await waitFor(() => expect(button).toBeEnabled());
    await user.click(button);
    await waitFor(() => expect(chain.assign).toHaveBeenCalledTimes(1));
    expect(issuedToken()?.signer).toBe(pub(posting));
    expect(chain.broadcastOperations).not.toHaveBeenCalled();
    // No account list on the way: the request never left this screen.
    expect(screen.queryByRole('link', { name: /unlock/i })).toBeNull();
  });

  it('keeps the request on screen after a wrong passcode', async () => {
    chain.granted = true;
    await protectedAndLocked({ posting: posting.toString() });
    renderConsent();
    const user = userEvent.setup();
    await user.type(
      await screen.findByLabelText(i18n.t('accounts.passcode')),
      'nope',
    );
    await user.keyboard('{Enter}');
    expect(await screen.findByRole('alert')).toHaveTextContent(
      i18n.t('login.invalid_hs_password'),
    );
    expect(getKeys('alice')).toBeNull();
    expect(chain.assign).not.toHaveBeenCalled();
    // Enter works as the button does.
    await user.clear(passcodeField());
    await user.type(passcodeField(), 'correct-passcode{Enter}');
    await waitFor(() => expect(chain.assign).toHaveBeenCalledTimes(1));
  });

  it('grants a first-time app in the same click when the active key is stored', async () => {
    await protectedAndLocked({
      posting: posting.toString(),
      active: active.toString(),
    });
    renderConsent();
    const user = userEvent.setup();
    // The grant is read from the chain, so it is announced before the passcode.
    expect(
      await screen.findByText(/first-time authorization/i),
    ).toBeInTheDocument();
    // A first-time request is read before anything is typed.
    expect(passcodeField()).not.toHaveFocus();
    await user.type(passcodeField(), 'correct-passcode');
    await user.click(screen.getByRole('button', { name: /^authorize$/i }));
    await waitFor(() => expect(chain.assign).toHaveBeenCalledTimes(1));
    expect(chain.broadcastOperations).toHaveBeenCalledWith(
      [expect.arrayContaining(['account_update'])],
      active.toString(),
      'alice',
    );
  });

  it('asks for the active key once unlocked when a first-time grant needs it, broadcasting nothing', async () => {
    await protectedAndLocked({ posting: posting.toString() });
    renderConsent();
    const user = userEvent.setup();
    await user.type(
      await screen.findByLabelText(i18n.t('accounts.passcode')),
      'correct-passcode',
    );
    // The form must mount once, already knowing the passcode: a first
    // render that asks for it again, even for a moment, is on screen.
    const asked: string[] = [];
    const observer = new MutationObserver(() => {
      if (document.querySelector('input[name=unlock-passcode]'))
        asked.push('unlock-passcode');
    });
    observer.observe(document.body, { childList: true, subtree: true });
    await user.click(screen.getByRole('button', { name: /^authorize$/i }));
    expect(await screen.findByTestId('add-active-key')).toBeInTheDocument();
    observer.disconnect();
    expect(asked).toEqual([]);
    // Not an error: the screen simply shows the next thing it needs.
    expect(screen.queryByRole('alert')).toBeNull();
    expect(chain.broadcastOperations).not.toHaveBeenCalled();
    expect(chain.assign).not.toHaveBeenCalled();
    // The passcode typed a moment ago is not asked for again, and the key
    // field takes the focus the passcode field had.
    expect(
      screen.queryByLabelText(
        i18n.t('authorize.active_key_passcode', { account: '@alice' }),
        { exact: false },
      ),
    ).toBeNull();
    expect(keyField()).toHaveFocus();
    await user.type(keyField(), active.toString());
    await user.click(addButton());
    await user.click(
      await screen.findByRole('button', { name: /^authorize$/i }),
    );
    await waitFor(() => expect(chain.assign).toHaveBeenCalledTimes(1));
    // Stored under the same passcode, still protected.
    expect(accountIsEncrypted('alice')).toBe(true);
    lockAccount('alice');
    expect((await unlockAccount('alice', 'correct-passcode')).active).toBe(
      active.toString(),
    );
  }, 30_000);

  it('unlocks and grants in one click on the grant page, which used to lose the request', async () => {
    await protectedAndLocked({ active: active.toString() });
    wrap(<GrantAction appName="ecency.app" mode="grant" />);
    const user = userEvent.setup();
    const button = await screen.findByRole('button', { name: /^authorize$/i });
    await user.type(passcodeField(), 'correct-passcode');
    await waitFor(() => expect(button).toBeEnabled());
    await user.click(button);
    await waitFor(() =>
      expect(chain.broadcastOperations).toHaveBeenCalledWith(
        [expect.arrayContaining(['account_update'])],
        active.toString(),
        'alice',
      ),
    );
    expect(screen.queryByRole('link', { name: /unlock/i })).toBeNull();
  });
});

describe('consent for a request that cannot be approved, with no account on this device', () => {
  it('does not send the visitor off to add an account for it', async () => {
    renderConsent({ redirectUri: 'https://evil.example/auth' });
    expect(
      await screen.findByRole('button', { name: /^authorize$/i }),
    ).toBeDisabled();
    expect(screen.queryByRole('link', { name: /continue/i })).toBeNull();
  });
});

describe('consent with neither posting nor active on this device', () => {
  it('sends the user to add one, carrying the request along', async () => {
    chain.granted = true;
    await addAccount('alice', { memo: memo.toString() });
    renderConsent();
    // The account name is an element of its own (kept out of page
    // translation), and jsdom's accessible name puts spaces around it.
    const link = await screen.findByRole('link', {
      name: /^Add a posting or active key for @\s?alice\s?to continue$/,
    });
    expect(link).toHaveTextContent(
      i18n.t('authorize.add_key_to_continue', { account: '@alice' }),
    );
    expect(link).toHaveAttribute('href', '/import');
    expect(link.getAttribute('data-search')).toContain('/oauth2/authorize');
  });
});

describe('the grant page with only a posting key on this device', () => {
  it('continues when the app already holds the grant, rather than asking to unlock', async () => {
    chain.granted = true;
    await addAccount('alice', { posting: posting.toString() });
    wrap(<GrantAction appName="ecency.app" mode="grant" query={{}} />);
    expect(
      await screen.findByRole('link', { name: /continue/i }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /unlock/i })).toBeNull();
  });

  it('asks for the active key in place, then grants with it', async () => {
    await addAccount('alice', { posting: posting.toString() });
    wrap(<GrantAction appName="ecency.app" mode="grant" query={{}} />);
    const user = userEvent.setup();
    await screen.findByTestId('add-active-key');
    expect(screen.queryByRole('link', { name: /unlock/i })).toBeNull();
    await user.type(keyField(), active.toString());
    await user.click(protectBox());
    await user.click(addButton());
    await user.click(
      await screen.findByRole('button', { name: /^authorize$/i }),
    );
    await waitFor(() =>
      expect(chain.broadcastOperations).toHaveBeenCalledTimes(1),
    );
    expect(chain.broadcastOperations.mock.calls[0][1]).toBe(active.toString());
  });
});

describe('the grant page when the account cannot be used', () => {
  it('says so when the chain does not know the account, instead of waiting for ever', async () => {
    await addAccount('alice', { posting: posting.toString() });
    chain.getAccount.mockImplementation(async () => null);
    wrap(<GrantAction appName="ecency.app" mode="grant" query={{}} />);
    expect(
      await screen.findByText(
        wholeText(i18n.t('authorize.account_missing', { account: '@alice' })),
      ),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '…' })).toBeNull();
    expect(screen.queryByTestId('add-active-key')).toBeNull();
  });

  it('offers a retry when the account cannot be read', async () => {
    await addAccount('alice', { posting: posting.toString() });
    let down = true;
    chain.getAccount.mockImplementation(async () => {
      if (down) throw new Error('rpc down');
      return alice();
    });
    wrap(<GrantAction appName="ecency.app" mode="grant" query={{}} />);
    await screen.findByText(i18n.t('authorize.read_failed'));
    down = false;
    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: i18n.t('authorize.retry') }));
    expect(await screen.findByTestId('add-active-key')).toBeInTheDocument();
  });
});

describe('an app name taken from the link', () => {
  const RLO = '‮';

  it('is never looked up or shown as typed when it is not a Hive account name', async () => {
    await addAccount('alice', { posting: posting.toString() });
    renderConsent({ clientId: `ecency.app${RLO}` });
    expect(
      await screen.findByText(
        wholeText(i18n.t('authorize.app_not_found', { app: '@ecency.app�' })),
      ),
    ).toBeInTheDocument();
    expect(document.body.textContent).not.toContain(RLO);
    expect(chain.getAccount).not.toHaveBeenCalledWith(`ecency.app${RLO}`);
    expect(screen.getByRole('button', { name: /^authorize$/i })).toBeDisabled();
    expect(screen.queryByTestId('add-active-key')).toBeNull();
  });

  it('is shown without control characters on the grant page', async () => {
    await addAccount('alice', { posting: posting.toString() });
    wrap(<GrantAction appName={`ecency.app${RLO}`} mode="grant" query={{}} />);
    await screen.findByRole('heading', { level: 1 });
    expect(document.body.textContent).not.toContain(RLO);
  });
});
