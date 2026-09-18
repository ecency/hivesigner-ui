import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen, waitFor } from '@testing-library/react';
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
vi.mock('@/lib/hive', () => ({ getAccount: h.getAccount }));
vi.mock('@/lib/sign-tx', () => ({
  broadcastOperations: h.broadcastOperations,
}));

import {
  _resetKeyCache,
  addAccount,
  isUnlocked,
  lockAccount,
  selectAccount,
} from '@/lib/accounts';
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
  h.unlockGate = null;
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

  it('saves what the form holds when the unlock ends, not when it was clicked', async () => {
    await addAccount('alice', { posting: '5Kposting' }, 'pass');
    lockAccount('alice');
    h.broadcastOperations.mockResolvedValue({ id: 'tx' });
    let release = () => {};
    h.unlockGate = new Promise<void>((r) => {
      release = r;
    });
    const user = userEvent.setup();
    renderPage();
    const name = () => screen.getByLabelText(/^name/i);
    await waitFor(() => expect(name()).toHaveValue('Alice'));
    await user.type(screen.getByLabelText(i18n.t('accounts.passcode')), 'pass');
    await user.click(screen.getByRole('button', { name: /save/i }));
    // Typed while the passcode is checked: the fields stay editable.
    await user.type(name(), ' B');
    release();
    await waitFor(() => expect(h.broadcastOperations).toHaveBeenCalledTimes(1));
    const [ops] = h.broadcastOperations.mock.calls[0];
    expect(JSON.parse(ops[0][1].posting_json_metadata).profile.name).toBe(
      'Alice B',
    );
  }, 30_000);

  it('saves nothing when another tab chose someone else during the unlock', async () => {
    await addAccount('alice', { posting: '5Kposting' }, 'pass');
    await addAccount('bob', { posting: '5Kbob' }, 'bob-pass');
    // A fresh session: this tab has made no choice of its own, so the one
    // in storage (another tab's) is adopted when the unlock lands.
    _resetKeyCache();
    h.broadcastOperations.mockResolvedValue({ id: 'tx' });
    let release = () => {};
    h.unlockGate = new Promise<void>((r) => {
      release = r;
    });
    const user = userEvent.setup();
    renderPage();
    const name = () => screen.getByLabelText(/^name/i);
    await waitFor(() => expect(name()).toHaveValue('Alice'));
    await user.type(name(), ' B');
    await user.type(screen.getByLabelText(i18n.t('accounts.passcode')), 'pass');
    await user.click(screen.getByRole('button', { name: /save/i }));
    const raw = JSON.parse(localStorage.getItem('vuex__accounts') as string);
    localStorage.setItem(
      'vuex__accounts',
      JSON.stringify({ ...raw, selectedAccount: 'bob' }),
    );
    release();
    await waitFor(() => expect(isUnlocked('alice')).toBe(true));
    await new Promise((r) => setTimeout(r, 50));
    // Neither bob's form onto alice, nor alice's edit behind the user's back.
    expect(h.broadcastOperations).not.toHaveBeenCalled();
  }, 30_000);

  // Saved elsewhere after the page loaded: another app's profile edit and
  // metadata this form does not show.
  const changedElsewhere = {
    ...account,
    posting_json_metadata: JSON.stringify({
      profile: {
        name: 'Alice',
        about: 'written elsewhere',
        website: 'https://a.example',
        type: 'app',
        redirect_uris: ['https://a.example/cb'],
        pinned: 'post-1',
      },
      other: { keep: 'newer' },
    }),
  };

  async function editNameAndSave() {
    const user = userEvent.setup();
    const name = () => screen.getByLabelText(/^name/i);
    await waitFor(() => expect(name()).toHaveValue('Alice'));
    await user.clear(name());
    await user.type(name(), 'Alice Two');
    await user.click(screen.getByRole('button', { name: /save/i }));
  }

  it('lays the edited fields over the profile as the chain has it at the save', async () => {
    await addAccount('alice', { posting: '5Kposting' });
    h.broadcastOperations.mockResolvedValue({ id: 'tx' });
    h.getAccount
      .mockResolvedValueOnce(account)
      .mockResolvedValue(changedElsewhere);
    renderPage();
    await editNameAndSave();
    await waitFor(() => expect(h.broadcastOperations).toHaveBeenCalledTimes(1));
    const [ops] = h.broadcastOperations.mock.calls[0];
    const meta = JSON.parse(ops[0][1].posting_json_metadata);
    expect(meta.profile.name).toBe('Alice Two');
    // Left alone here, so what was saved elsewhere stays.
    expect(meta.profile.about).toBe('written elsewhere');
    expect(meta.profile.pinned).toBe('post-1');
    expect(meta.other).toEqual({ keep: 'newer' });
  });

  it('saves nothing when the account cannot be read at the save', async () => {
    await addAccount('alice', { posting: '5Kposting' });
    h.getAccount
      .mockResolvedValueOnce(account)
      .mockRejectedValue(new Error('node down'));
    renderPage();
    await editNameAndSave();
    expect(await screen.findByRole('alert')).toHaveTextContent(
      i18n.t('authorize.read_failed'),
    );
    expect(h.broadcastOperations).not.toHaveBeenCalled();
  });

  it('saves nothing when no account comes back at the save', async () => {
    await addAccount('alice', { posting: '5Kposting' });
    h.getAccount.mockResolvedValueOnce(account).mockResolvedValue(null);
    renderPage();
    await editNameAndSave();
    expect(await screen.findByRole('alert')).toHaveTextContent(
      i18n.t('common.try_again'),
    );
    expect(h.broadcastOperations).not.toHaveBeenCalled();
  });

  it('keeps edits with their account: a switch shows and saves the new one as it is', async () => {
    await addAccount('alice', { posting: '5Kposting' });
    await addAccount('bob', { posting: '5Kbob' });
    selectAccount('alice');
    const bobAccount = {
      ...account,
      name: 'bob',
      posting_json_metadata: JSON.stringify({
        profile: { name: 'Bob', about: 'bob here' },
      }),
    };
    h.getAccount.mockImplementation(async (n: string) =>
      n === 'bob' ? bobAccount : account,
    );
    h.broadcastOperations.mockResolvedValue({ id: 'tx' });
    const user = userEvent.setup();
    renderPage();
    const name = () => screen.getByLabelText(/^name/i);
    await waitFor(() => expect(name()).toHaveValue('Alice'));
    await user.clear(name());
    await user.type(name(), 'Alice Two');
    act(() => selectAccount('bob'));
    await waitFor(() => expect(name()).toHaveValue('Bob'));
    const about = screen.getByLabelText(/^about/i);
    await user.clear(about);
    await user.type(about, 'new about');
    await user.click(screen.getByRole('button', { name: /save/i }));
    await waitFor(() => expect(h.broadcastOperations).toHaveBeenCalledTimes(1));
    const [ops, key, signer] = h.broadcastOperations.mock.calls[0];
    expect([key, signer]).toEqual(['5Kbob', 'bob']);
    const meta = JSON.parse(ops[0][1].posting_json_metadata);
    // Nothing typed for alice reaches bob's profile.
    expect(meta.profile).toMatchObject({ name: 'Bob', about: 'new about' });
  });

  it('saves nothing when the read comes from a node that leaves the metadata out', async () => {
    await addAccount('alice', { posting: '5Kposting' });
    h.getAccount
      .mockResolvedValueOnce(account)
      .mockResolvedValue({ ...account, posting_json_metadata: '' });
    renderPage();
    await editNameAndSave();
    expect(await screen.findByRole('alert')).toHaveTextContent(
      i18n.t('common.try_again'),
    );
    // The form still shows the profile, and trying again is refused again.
    expect(screen.getByLabelText(/redirect/i)).toHaveValue(
      'https://a.example/cb',
    );
    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: /save/i }));
    await waitFor(() => expect(h.getAccount).toHaveBeenCalledTimes(3));
    await new Promise((r) => setTimeout(r, 50));
    expect(h.broadcastOperations).not.toHaveBeenCalled();
    expect(screen.getByLabelText(/redirect/i)).toHaveValue(
      'https://a.example/cb',
    );
  });

  it('saves what was typed while the account was read', async () => {
    await addAccount('alice', { posting: '5Kposting' });
    h.broadcastOperations.mockResolvedValue({ id: 'tx' });
    let release = (_: unknown) => {};
    h.getAccount.mockResolvedValueOnce(account).mockReturnValue(
      new Promise((r) => {
        release = r;
      }),
    );
    renderPage();
    await editNameAndSave();
    await waitFor(() => expect(h.getAccount).toHaveBeenCalledTimes(2));
    await userEvent.setup().type(screen.getByLabelText(/^name/i), '!');
    release(account);
    await waitFor(() => expect(h.broadcastOperations).toHaveBeenCalledTimes(1));
    const [ops] = h.broadcastOperations.mock.calls[0];
    expect(JSON.parse(ops[0][1].posting_json_metadata).profile.name).toBe(
      'Alice Two!',
    );
  });

  it('saves nothing for a user who left while the account was read', async () => {
    await addAccount('alice', { posting: '5Kposting' });
    h.broadcastOperations.mockResolvedValue({ id: 'tx' });
    let release = (_: unknown) => {};
    h.getAccount.mockResolvedValueOnce(account).mockReturnValue(
      new Promise((r) => {
        release = r;
      }),
    );
    const view = renderPage();
    await editNameAndSave();
    await waitFor(() => expect(h.getAccount).toHaveBeenCalledTimes(2));
    view.unmount();
    release(account);
    await new Promise((r) => setTimeout(r, 50));
    expect(h.broadcastOperations).not.toHaveBeenCalled();
  });
});
