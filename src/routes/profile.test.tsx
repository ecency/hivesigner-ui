import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentType } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import i18n from '../i18n';

vi.mock('@tanstack/react-router', async () =>
  (await import('../test-router-mock')).routerMock(),
);
const h = vi.hoisted(() => ({
  getAccount: vi.fn(),
  broadcastOperations: vi.fn(),
}));
vi.mock('@/lib/hive', () => ({ getAccount: h.getAccount }));
vi.mock('@/lib/sign-tx', () => ({
  broadcastOperations: h.broadcastOperations,
}));

import { _resetKeyCache, addAccount, lockAccount } from '@/lib/accounts';
import { buildProfileMetadata, Route } from './profile';

const Profile = (Route as unknown as { component: ComponentType }).component;

const account = {
  name: 'alice',
  posting_json_metadata: JSON.stringify({
    profile: {
      name: 'Alice',
      about: 'hi',
      website: 'https://a.example',
      type: 'app',
      redirect_uris: ['https://a.example/cb'],
    },
    other: { keep: true },
  }),
  posting: { weight_threshold: 1, account_auths: [], key_auths: [] },
};

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <Profile />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  localStorage.clear();
  _resetKeyCache();
  h.getAccount.mockReset();
  h.broadcastOperations.mockReset();
  h.getAccount.mockResolvedValue(account);
});

describe('buildProfileMetadata', () => {
  it('keeps unrelated metadata and profile keys, and writes the redirect list', () => {
    const out = JSON.parse(
      buildProfileMetadata(account as never, {
        name: 'New',
        about: '',
        website: '',
        location: '',
        profile_image: '',
        cover_image: '',
        redirect_uris: ' https://x.example/a \n\nhttps://x.example/b',
      }),
    );
    expect(out.other).toEqual({ keep: true });
    expect(out.profile.type).toBe('app');
    expect(out.profile.name).toBe('New');
    expect(out.profile.redirect_uris).toEqual([
      'https://x.example/a',
      'https://x.example/b',
    ]);
  });

  it('removes redirect_uris entirely when the list is emptied', () => {
    const out = JSON.parse(
      buildProfileMetadata(account as never, {
        name: 'A',
        about: '',
        website: '',
        location: '',
        profile_image: '',
        cover_image: '',
        redirect_uris: '',
      }),
    );
    expect(out.profile).not.toHaveProperty('redirect_uris');
  });
});

describe('/profile', () => {
  it('asks to log in when no account is selected', () => {
    renderPage();
    expect(screen.getByRole('link', { name: /login/i })).toHaveAttribute(
      'href',
      '/accounts',
    );
  });

  it('prefills the form from the on-chain profile', async () => {
    await addAccount('alice', { posting: '5Kposting' });
    renderPage();
    await waitFor(() =>
      expect(screen.getByLabelText(/^name/i)).toHaveValue('Alice'),
    );
    expect(screen.getByLabelText(/redirect/i)).toHaveValue(
      'https://a.example/cb',
    );
  });

  it('refuses a plain-http callback that is not loopback, before broadcasting', async () => {
    await addAccount('alice', { posting: '5Kposting' });
    renderPage();
    const user = userEvent.setup();
    await waitFor(() =>
      expect(screen.getByLabelText(/redirect/i)).toHaveValue(
        'https://a.example/cb',
      ),
    );
    const uris = screen.getByLabelText(/redirect/i);
    await user.clear(uris);
    await user.type(uris, 'http://insecure.example/cb');
    await user.click(screen.getByRole('button', { name: /save/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      /insecure\.example/,
    );
    expect(h.broadcastOperations).not.toHaveBeenCalled();
  });

  it('saves with account_update2 signed by the posting key', async () => {
    await addAccount('alice', { posting: '5Kposting' });
    h.broadcastOperations.mockResolvedValue({ id: 'tx' });
    renderPage();
    const user = userEvent.setup();
    await waitFor(() =>
      expect(screen.getByLabelText(/^name/i)).toHaveValue('Alice'),
    );
    const name = screen.getByLabelText(/^name/i);
    await user.clear(name);
    await user.type(name, 'Alice Two');
    await user.click(screen.getByRole('button', { name: /save/i }));
    await waitFor(() => expect(h.broadcastOperations).toHaveBeenCalledTimes(1));
    const [ops, key, signer] = h.broadcastOperations.mock.calls[0];
    expect(key).toBe('5Kposting');
    expect(signer).toBe('alice');
    expect(ops[0][0]).toBe('account_update2');
    expect(JSON.parse(ops[0][1].posting_json_metadata).profile.name).toBe(
      'Alice Two',
    );
    expect(await screen.findByText(/saved/i)).toBeInTheDocument();
  });

  it('says which key is missing instead of offering save without a posting key', async () => {
    await addAccount('alice', { active: '5Kactive' });
    renderPage();
    await waitFor(() =>
      expect(screen.getByLabelText(/^name/i)).toHaveValue('Alice'),
    );
    expect(screen.queryByRole('button', { name: /save/i })).toBeNull();
    expect(document.body.textContent).toMatch(/needs your posting key/i);
    // Nothing on the account list would add it: no link there.
    expect(screen.queryByRole('link', { name: /unlock/i })).toBeNull();
  });

  it('a locked account: the passcode here, and the same click saves (#146)', async () => {
    await addAccount('alice', { posting: '5Kposting' }, 'pass');
    lockAccount('alice');
    h.broadcastOperations.mockResolvedValue({ id: 'tx' });
    const user = userEvent.setup();
    renderPage();
    await waitFor(() =>
      expect(screen.getByLabelText(/^name/i)).toHaveValue('Alice'),
    );
    await user.clear(screen.getByLabelText(/^name/i));
    await user.type(screen.getByLabelText(/^name/i), 'Alice B');
    await user.type(screen.getByLabelText(i18n.t('accounts.passcode')), 'pass');
    await user.click(screen.getByRole('button', { name: /save/i }));
    await waitFor(() => expect(h.broadcastOperations).toHaveBeenCalledTimes(1));
    const [ops, key] = h.broadcastOperations.mock.calls[0];
    expect(key).toBe('5Kposting');
    expect(JSON.parse(ops[0][1].posting_json_metadata).profile.name).toBe(
      'Alice B',
    );
  }, 30_000);
});
