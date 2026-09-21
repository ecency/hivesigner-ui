import { PrivateKey, Signature } from '@ecency/sdk/hive';
import { sha256 } from '@noble/hashes/sha2.js';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentType } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import i18n from '../i18n';

vi.mock('@tanstack/react-router', async () =>
  (await import('../test-router-mock')).routerMock(),
);
const h = vi.hoisted(() => ({
  getAccount: vi.fn(),
  assign: vi.fn(),
  // Holds every unlock until released, when a test sets it.
  unlockGate: null as null | Promise<void>,
}));
vi.mock('@/lib/keystore', async (importOriginal) => {
  const real = await importOriginal<typeof import('@/lib/keystore')>();
  return {
    ...real,
    readKeys: async (field: string, passcode?: string) => {
      if (h.unlockGate) await h.unlockGate;
      return real.readKeys(field, passcode);
    },
  };
});
vi.mock('@/lib/hive', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/hive')>()),
  getAccount: h.getAccount,
}));

import {
  _resetKeyCache,
  addAccount,
  isUnlocked,
  lockAccount,
  selectAccount,
} from '@/lib/accounts';
import { oauthAppProfileKey } from '@/lib/query-keys';
import { routerState } from '../test-router-mock';
import { Route } from './sign-buffer';

const SignBuffer = (Route as unknown as { component: ComponentType }).component;

const POSTING = PrivateKey.fromSeed('sign-buffer posting');
const ACTIVE = PrivateKey.fromSeed('sign-buffer active');
const pub = (k: PrivateKey) => k.createPublic().toString();

const app = {
  name: 'app',
  posting_json_metadata: JSON.stringify({
    profile: {
      name: 'Example App',
      type: 'app',
      redirect_uris: ['https://app.example/cb'],
    },
  }),
};

function renderPage(
  search: Record<string, string>,
  seed?: (client: QueryClient) => void,
) {
  routerState.search = search;
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  seed?.(client);
  return render(
    <QueryClientProvider client={client}>
      <SignBuffer />
    </QueryClientProvider>,
  );
}

/** The one redirect's query, and who its signature recovers to. */
function answer(message: string) {
  expect(h.assign).toHaveBeenCalledTimes(1);
  const url = new URL(h.assign.mock.calls[0][0]);
  const signature = url.searchParams.get('signature') as string;
  return {
    url,
    signer: Signature.from(signature)
      .getPublicKey(sha256(new TextEncoder().encode(message)))
      .toString(),
  };
}

const sign = () =>
  userEvent.setup().click(screen.getByRole('button', { name: /^sign$/i }));

beforeEach(async () => {
  localStorage.clear();
  _resetKeyCache();
  h.getAccount.mockReset();
  h.getAccount.mockImplementation(async (name: string) =>
    name === 'app' ? app : null,
  );
  h.assign.mockReset();
  h.unlockGate = null;
  vi.stubGlobal('location', {
    ...window.location,
    pathname: '/sign-buffer',
    search: '',
    assign: h.assign,
  });
  await addAccount('alice', { posting: POSTING.toString() });
  selectAccount('alice');
});

describe('/sign-buffer', () => {
  it('a site with no app is named by its host, and gets the signature back', async () => {
    const message = 'Log in to site.example, nonce 7f3a';
    renderPage({
      message,
      redirect_uri: 'https://site.example/cb?from=hs',
      state: 's1',
    });
    expect(screen.getByRole('heading')).toHaveTextContent(
      'site.example asks you to sign a message.',
    );
    expect(screen.getByText(message)).toBeInTheDocument();
    // Named again next to the button, where a long message cannot push it.
    expect(
      screen.getByRole('button', { name: /^sign$/i }).parentElement
        ?.textContent,
    ).toContain('Sends you to site.example');
    await sign();
    const { url, signer } = answer(message);
    expect(url.origin + url.pathname).toBe('https://site.example/cb');
    expect(url.searchParams.get('from')).toBe('hs');
    expect(signer).toBe(pub(POSTING));
    expect(url.searchParams.get('public_key')).toBe(pub(POSTING));
    expect(url.searchParams.get('username')).toBe('alice');
    expect(url.searchParams.get('authority')).toBe('posting');
    expect(url.searchParams.get('state')).toBe('s1');
  });

  it('an app is named by its profile and answered on its registered callback', async () => {
    renderPage({
      message: 'hello',
      client_id: 'app',
      redirect_uri: 'https://app.example/cb',
    });
    expect(await screen.findByRole('heading')).toHaveTextContent(
      'Example App asks you to sign a message.',
    );
    await sign();
    expect(answer('hello').url.origin).toBe('https://app.example');
  });

  it('refuses a request it cannot answer safely, and signs nothing', async () => {
    const refused: Record<string, string>[] = [
      { client_id: 'app', redirect_uri: 'https://evil.example/cb' },
      { client_id: 'noapp', redirect_uri: 'https://app.example/cb' },
      { client_id: 'Not An App', redirect_uri: 'https://app.example/cb' },
      { client_id: 'app', redirect_uri: 'http://app.example/cb' },
      { client_id: 'app', redirect_uri: 'javascript:alert(1)' },
      { redirect_uri: 'http://site.example/cb' },
      { redirect_uri: 'javascript:alert(1)' },
      { redirect_uri: '' },
      { redirect_uri: 'https://site.example/cb', message: '' },
      { redirect_uri: 'https://site.example/cb', message: ' \n\t' },
      { redirect_uri: 'https://site.example/cb', authority: 'owner' },
      { redirect_uri: 'https://site.example/cb', authority: 'memo' },
    ];
    for (const search of refused) {
      renderPage({ message: 'hello', ...search });
      expect(await screen.findByRole('alert')).toHaveTextContent(
        i18n.t('sign_buffer.refused'),
      );
      expect(screen.queryByRole('button', { name: /^sign$/i })).toBeNull();
      cleanup();
    }
    expect(h.assign).not.toHaveBeenCalled();
  });

  it("signs nothing until the app's profile is read, and offers to retry", async () => {
    h.getAccount.mockRejectedValue(new Error('node down'));
    renderPage({
      message: 'Log in to the app, nonce 7f3a',
      client_id: 'app',
      redirect_uri: 'https://evil.example/cb',
    });
    expect(await screen.findByRole('alert')).toHaveTextContent(
      i18n.t('authorize.read_failed'),
    );
    expect(screen.queryByRole('button', { name: /^sign$/i })).toBeNull();
    expect(screen.queryByRole('heading')).toBeNull();
    // Read now: the callback is checked, and it is not the app's.
    h.getAccount.mockImplementation(async (name: string) =>
      name === 'app' ? app : null,
    );
    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: i18n.t('authorize.retry') }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      i18n.t('sign_buffer.refused'),
    );
    expect(h.assign).not.toHaveBeenCalled();
  });

  // What an earlier consent screen left in the shared cache: the app had
  // this callback registered then.
  const cachedBefore = (client: QueryClient) =>
    client.setQueryData(oauthAppProfileKey('app'), {
      name: 'Example App',
      redirectUris: ['https://old.example/cb'],
    });

  it('decides nothing on an app profile cached before this visit', async () => {
    // Removed since: the app's profile no longer lists the old callback.
    renderPage(
      {
        message: 'hello',
        client_id: 'app',
        redirect_uri: 'https://old.example/cb',
      },
      cachedBefore,
    );
    expect(screen.queryByRole('button', { name: /^sign$/i })).toBeNull();
    expect(await screen.findByRole('alert')).toHaveTextContent(
      i18n.t('sign_buffer.refused'),
    );
    expect(h.assign).not.toHaveBeenCalled();
  });

  it('signs nothing on a cached profile when this visit cannot read it', async () => {
    h.getAccount.mockRejectedValue(new Error('node down'));
    renderPage(
      {
        message: 'hello',
        client_id: 'app',
        redirect_uri: 'https://old.example/cb',
      },
      cachedBefore,
    );
    expect(await screen.findByRole('alert')).toHaveTextContent(
      i18n.t('authorize.read_failed'),
    );
    expect(screen.queryByRole('button', { name: /^sign$/i })).toBeNull();
  });

  it('never signs a Hivesigner token body', () => {
    renderPage({
      message: JSON.stringify({
        signed_message: { type: 'code', app: 'ecency.app' },
        authors: ['alice'],
        timestamp: 1726650000,
      }),
      redirect_uri: 'https://site.example/cb',
    });
    expect(screen.getByRole('alert')).toHaveTextContent(
      i18n.t('sign_buffer.token_refused'),
    );
    expect(screen.queryByRole('button', { name: /^sign$/i })).toBeNull();
    expect(h.assign).not.toHaveBeenCalled();
  });

  it('signs with the active key when asked, and says so when it is missing', async () => {
    const search = {
      message: 'hello',
      authority: 'active',
      redirect_uri: 'https://site.example/cb',
    };
    renderPage(search);
    expect(document.body.textContent).toMatch(/needs your active key/i);
    expect(screen.queryByRole('button', { name: /^sign$/i })).toBeNull();
    cleanup();

    await addAccount('bob', {
      posting: POSTING.toString(),
      active: ACTIVE.toString(),
    });
    selectAccount('bob');
    renderPage(search);
    await sign();
    const { url, signer } = answer('hello');
    expect(signer).toBe(pub(ACTIVE));
    expect(url.searchParams.get('authority')).toBe('active');
    expect(url.searchParams.get('username')).toBe('bob');
  });

  it('shows the characters that would hide or reorder the text', () => {
    renderPage({
      message: `pay ${String.fromCodePoint(0x202e)}gnp.exe`,
      redirect_uri: 'https://site.example/cb',
    });
    expect(screen.getByText('\\u{202E}').tagName).toBe('MARK');
  });

  it('a locked account: the passcode here, and the same click signs', async () => {
    _resetKeyCache();
    localStorage.clear();
    await addAccount('alice', { posting: POSTING.toString() }, 'pass');
    lockAccount('alice');
    renderPage({ message: 'hello', redirect_uri: 'https://site.example/cb' });
    const user = userEvent.setup();
    await user.type(screen.getByLabelText(i18n.t('accounts.passcode')), 'pass');
    await user.click(screen.getByRole('button', { name: /^sign$/i }));
    await waitFor(() => expect(h.assign).toHaveBeenCalledTimes(1));
    expect(answer('hello').signer).toBe(pub(POSTING));
  }, 30_000);

  it('signs nothing when another tab chose someone else during the unlock', async () => {
    _resetKeyCache();
    localStorage.clear();
    await addAccount('alice', { posting: POSTING.toString() }, 'pass');
    await addAccount('bob', { posting: ACTIVE.toString() }, 'bob-pass');
    // A fresh session: this tab adopts the choice in storage (another tab's)
    // when the unlock lands.
    _resetKeyCache();
    selectAccount('alice');
    _resetKeyCache();
    let release = () => {};
    h.unlockGate = new Promise<void>((r) => {
      release = r;
    });
    renderPage({ message: 'hello', redirect_uri: 'https://site.example/cb' });
    const user = userEvent.setup();
    await user.type(screen.getByLabelText(i18n.t('accounts.passcode')), 'pass');
    await user.click(screen.getByRole('button', { name: /^sign$/i }));
    const raw = JSON.parse(localStorage.getItem('vuex__accounts') as string);
    localStorage.setItem(
      'vuex__accounts',
      JSON.stringify({ ...raw, selectedAccount: 'bob' }),
    );
    release();
    await waitFor(() => expect(isUnlocked('alice')).toBe(true));
    await new Promise((r) => setTimeout(r, 50));
    expect(h.assign).not.toHaveBeenCalled();
  }, 30_000);
});
