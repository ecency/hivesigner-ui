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

/** The form as the page holds it: an app account, nothing typed. */
function form(changed: Record<string, string> = {}) {
  return {
    name: '',
    about: '',
    website: '',
    location: '',
    profile_image: '',
    cover_image: '',
    is_app: '1',
    redirect_uris: '',
    creator: '',
    is_public: '0',
    secret: '',
    ...changed,
  };
}

describe('buildProfileMetadata', () => {
  it('keeps unrelated metadata and profile keys, and writes the redirect list', () => {
    const out = JSON.parse(
      buildProfileMetadata(
        account as never,
        form({
          name: 'New',
          redirect_uris: ' https://x.example/a \n\nhttps://x.example/b',
        }),
      ),
    );
    expect(out.other).toEqual({ keep: true });
    expect(out.profile.type).toBe('app');
    expect(out.profile.name).toBe('New');
    expect(out.profile.redirect_uris).toEqual([
      'https://x.example/a',
      'https://x.example/b',
    ]);
  });

  it('writes a profile over metadata that is valid JSON but no object', () => {
    const typed = form({ name: 'New' });
    for (const posting_json_metadata of [
      'null',
      '[1,2]',
      '"text"',
      '{"profile":null}',
      '{"profile":"abc"}',
      '{"profile":[1]}',
    ]) {
      const out = JSON.parse(
        buildProfileMetadata(
          { ...account, posting_json_metadata } as never,
          typed,
        ),
      );
      expect(out).not.toHaveProperty('0');
      expect(out.profile).toEqual({
        name: 'New',
        about: '',
        website: '',
        location: '',
        profile_image: '',
        cover_image: '',
        version: 2,
        type: 'app',
        is_public: false,
      });
    }
  });

  it('removes redirect_uris entirely when the list is emptied', () => {
    const out = JSON.parse(
      buildProfileMetadata(account as never, form({ name: 'A' })),
    );
    expect(out.profile).not.toHaveProperty('redirect_uris');
  });

  // The API reads posting_json_metadata only when the profile has a version,
  // and the older json_metadata profile without one.
  it('writes version 2 on every save, app or not', () => {
    for (const is_app of ['1', '0']) {
      const out = JSON.parse(
        buildProfileMetadata(account as never, form({ is_app })),
      );
      expect(out.profile.version).toBe(2);
    }
  });

  it('writes the app settings, with the secret as its sha256', () => {
    const out = JSON.parse(
      buildProfileMetadata(
        account as never,
        form({
          creator: 'alice',
          is_public: '1',
          secret: 'hunter2',
          redirect_uris: 'https://a.example/cb',
        }),
      ),
    );
    expect(out.profile.type).toBe('app');
    expect(out.profile.creator).toBe('alice');
    expect(out.profile.is_public).toBe(true);
    // sha256('hunter2'), the hash the API compares a client secret against.
    expect(out.profile.secret).toBe(
      'f52fbd32b2b3b86ff88ef6c490628285f482af15ddcb29541f94bcf526a3f6c7',
    );
    expect(out.profile.secret).not.toBe('hunter2');
  });

  it('keeps the stored secret when the field is left blank', () => {
    const app = {
      ...account,
      posting_json_metadata: JSON.stringify({
        profile: { type: 'app', secret: 'a'.repeat(64), creator: 'bob' },
      }),
    };
    const out = JSON.parse(
      buildProfileMetadata(app as never, form({ creator: 'bob' })),
    );
    expect(out.profile.secret).toBe('a'.repeat(64));
  });

  it('drops the creator when it is cleared', () => {
    const app = {
      ...account,
      posting_json_metadata: JSON.stringify({
        profile: { type: 'app', creator: 'bob' },
      }),
    };
    const out = JSON.parse(buildProfileMetadata(app as never, form()));
    expect(out.profile).not.toHaveProperty('creator');
  });

  // Turning the switch off says "not an app". It does not delete the app's
  // settings: they are hidden, not edited, so nothing in the form describes
  // them, and clearing the callbacks of an app switched off by mistake would
  // be silent damage.
  it('a user account keeps the settings it had, and says type user', () => {
    const app = {
      ...account,
      posting_json_metadata: JSON.stringify({
        profile: {
          type: 'app',
          secret: 'b'.repeat(64),
          creator: 'bob',
          is_public: true,
          redirect_uris: ['https://a.example/cb'],
        },
      }),
    };
    const out = JSON.parse(
      buildProfileMetadata(app as never, form({ is_app: '0' })),
    );
    expect(out.profile.type).toBe('user');
    expect(out.profile.secret).toBe('b'.repeat(64));
    expect(out.profile.creator).toBe('bob');
    expect(out.profile.is_public).toBe(true);
    expect(out.profile.redirect_uris).toEqual(['https://a.example/cb']);
  });

  // The API reads json_metadata for a profile with no version, so the version
  // written here moves it to this one. #154
  it('carries the older secret and allowlist over with the version', () => {
    const app = {
      ...account,
      json_metadata: JSON.stringify({
        profile: {
          type: 'app',
          secret: 'c'.repeat(64),
          allowed_ips: ['203.0.113.7'],
        },
      }),
      posting_json_metadata: JSON.stringify({
        profile: { type: 'app', redirect_uris: ['https://a.example/cb'] },
      }),
    };
    const out = JSON.parse(
      buildProfileMetadata(
        app as never,
        form({ redirect_uris: 'https://a.example/cb' }),
      ),
    );
    expect(out.profile.version).toBe(2);
    expect(out.profile.secret).toBe('c'.repeat(64));
    expect(out.profile.allowed_ips).toEqual(['203.0.113.7']);
  });

  it('leaves a profile that has a version alone', () => {
    const app = {
      ...account,
      json_metadata: JSON.stringify({
        profile: { secret: 'c'.repeat(64) },
      }),
      posting_json_metadata: JSON.stringify({
        profile: { type: 'app', version: 2 },
      }),
    };
    const out = JSON.parse(buildProfileMetadata(app as never, form()));
    expect(out.profile).not.toHaveProperty('secret');
  });

  // Nothing reads a `type` of user, and a profile that never had one is not
  // an app being downgraded: a plain user saving their name should not have
  // a new key written onto their profile.
  it('adds no type to a profile that never had one', () => {
    const user = {
      ...account,
      posting_json_metadata: JSON.stringify({ profile: { name: 'Alice' } }),
    };
    const out = JSON.parse(
      buildProfileMetadata(user as never, form({ is_app: '0', name: 'A' })),
    );
    expect(out.profile).not.toHaveProperty('type');
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

  it('saves over metadata another app set to JSON null', async () => {
    await addAccount('alice', { posting: '5Kposting' });
    h.broadcastOperations.mockResolvedValue({ id: 'tx' });
    h.getAccount
      .mockResolvedValueOnce(account)
      .mockResolvedValue({ ...account, posting_json_metadata: 'null' });
    renderPage();
    await editNameAndSave();
    await waitFor(() => expect(h.broadcastOperations).toHaveBeenCalledTimes(1));
    const [ops] = h.broadcastOperations.mock.calls[0];
    expect(JSON.parse(ops[0][1].posting_json_metadata).profile.name).toBe(
      'Alice Two',
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

  it('shows the app settings only once the account says it is an app', async () => {
    h.getAccount.mockResolvedValue({
      ...account,
      posting_json_metadata: JSON.stringify({ profile: { name: 'Alice' } }),
    });
    await addAccount('alice', { posting: '5Kposting' });
    renderPage();
    const user = userEvent.setup();
    await waitFor(() =>
      expect(screen.getByLabelText(/^name/i)).toHaveValue('Alice'),
    );
    expect(screen.queryByLabelText(/redirect/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/client secret/i)).not.toBeInTheDocument();
    await user.click(screen.getByLabelText(/this account is an app/i));
    expect(screen.getByLabelText(/redirect/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/client secret/i)).toBeInTheDocument();
  });

  it('saves a typed secret as its hash, and clears the field', async () => {
    await addAccount('alice', { posting: '5Kposting' });
    h.broadcastOperations.mockResolvedValue({ id: 'tx' });
    renderPage();
    const user = userEvent.setup();
    await waitFor(() =>
      expect(screen.getByLabelText(/^name/i)).toHaveValue('Alice'),
    );
    const secret = screen.getByLabelText(/client secret/i);
    await user.type(secret, 'hunter2');
    await user.click(screen.getByRole('button', { name: /save/i }));
    await waitFor(() => expect(h.broadcastOperations).toHaveBeenCalledTimes(1));
    const [ops] = h.broadcastOperations.mock.calls[0];
    const saved = JSON.parse(ops[0][1].posting_json_metadata).profile;
    expect(saved.secret).toBe(
      'f52fbd32b2b3b86ff88ef6c490628285f482af15ddcb29541f94bcf526a3f6c7',
    );
    // Nothing keeps the plaintext, and a blank field is what "keep the
    // stored secret" looks like on the next save.
    await waitFor(() => expect(secret).toHaveValue(''));
  });
});
