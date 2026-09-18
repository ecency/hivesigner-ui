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

import {
  _resetKeyCache,
  addAccount,
  lockAccount,
  selectAccount,
} from '@/lib/accounts';
import { Route } from './authorized-apps';

const AuthorizedApps = (Route as unknown as { component: ComponentType })
  .component;

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <AuthorizedApps />
    </QueryClientProvider>,
  );
}

const account = {
  name: 'alice',
  posting: {
    weight_threshold: 1,
    account_auths: [
      ['ecency.app', 1],
      ['peakd.app', 1],
    ],
    key_auths: [],
  },
  active: { weight_threshold: 1, account_auths: [], key_auths: [] },
  owner: { weight_threshold: 1, account_auths: [], key_auths: [] },
  posting_json_metadata: '{}',
};

beforeEach(() => {
  localStorage.clear();
  _resetKeyCache();
  h.getAccount.mockReset();
  h.broadcastOperations.mockReset();
  h.getAccount.mockResolvedValue(account);
});

describe('/authorized-apps', () => {
  it('asks to log in when no account is selected', () => {
    renderPage();
    expect(screen.getByRole('link', { name: /login/i })).toHaveAttribute(
      'href',
      '/accounts',
    );
  });

  it('lists every app holding posting authority, with a revoke per row', async () => {
    await addAccount('alice', { active: '5Kactive' });
    renderPage();
    expect(await screen.findByText('@ecency.app')).toBeInTheDocument();
    expect(screen.getByText('@peakd.app')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /revoke/i })).toHaveLength(2);
  });

  it('revokes with an account_update signed by the active key and refreshes', async () => {
    await addAccount('alice', { active: '5Kactive' });
    h.broadcastOperations.mockResolvedValue({ id: 'tx' });
    renderPage();
    await screen.findByText('@ecency.app');
    await userEvent
      .setup()
      .click(screen.getAllByRole('button', { name: /revoke/i })[0]);
    await waitFor(() => expect(h.broadcastOperations).toHaveBeenCalledTimes(1));
    const [ops, key, signer] = h.broadcastOperations.mock.calls[0];
    expect(key).toBe('5Kactive');
    expect(signer).toBe('alice');
    expect(ops[0][0]).toBe('account_update');
    expect(ops[0][1].posting.account_auths).toEqual([['peakd.app', 1]]);
  });

  it('sends a revoke without the active key to the revoke page, which asks for it', async () => {
    await addAccount('alice', { posting: '5Kposting' });
    renderPage();
    await screen.findByText('@ecency.app');
    expect(screen.queryByRole('button', { name: /revoke/i })).toBeNull();
    expect(
      screen
        .getAllByRole('link', { name: /revoke/i })
        .map((l) => l.getAttribute('href')),
    ).toEqual(['/revoke/ecency.app', '/revoke/peakd.app']);
    expect(screen.queryByRole('link', { name: /unlock/i })).toBeNull();
  });

  it('a locked account is unlocked here, then revokes (#146)', async () => {
    await addAccount('alice', { active: '5Kactive' }, 'pass');
    lockAccount('alice');
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('@ecency.app');
    // One next step while locked: the passcode, not a revoke per row.
    expect(screen.queryAllByRole('link', { name: /revoke/i })).toHaveLength(0);
    expect(screen.queryAllByRole('button', { name: /revoke/i })).toHaveLength(
      0,
    );
    await user.type(screen.getByLabelText(i18n.t('accounts.passcode')), 'pass');
    await user.click(screen.getByRole('button', { name: /^unlock$/i }));
    await waitFor(
      () =>
        expect(screen.getAllByRole('button', { name: /revoke/i })).toHaveLength(
          2,
        ),
      { timeout: 10_000 },
    );
  }, 30_000);

  it('builds the revoke from a fresh read, keeping a grant made elsewhere since', async () => {
    await addAccount('alice', { active: '5Kactive' });
    h.broadcastOperations.mockResolvedValue({ id: 'tx' });
    renderPage();
    await screen.findByText('@ecency.app');
    // Another app was authorized elsewhere after this page loaded.
    h.getAccount.mockResolvedValue({
      ...account,
      posting: {
        ...account.posting,
        account_auths: [...account.posting.account_auths, ['new.app', 1]],
      },
    });
    await userEvent
      .setup()
      .click(screen.getAllByRole('button', { name: /revoke/i })[0]);
    await waitFor(() => expect(h.broadcastOperations).toHaveBeenCalledTimes(1));
    const [ops] = h.broadcastOperations.mock.calls[0];
    // A stale copy would have dropped new.app along with ecency.app.
    expect(ops[0][1].posting.account_auths).toEqual([
      ['peakd.app', 1],
      ['new.app', 1],
    ]);
  });

  describe('the read before a revoke is awaited', () => {
    async function revokeWithReadHeld() {
      await addAccount('alice', { active: '5Kactive' });
      h.broadcastOperations.mockResolvedValue({ id: 'tx' });
      const view = renderPage();
      await screen.findByText('@ecency.app');
      let release = () => {};
      h.getAccount.mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            release = () => resolve(account);
          }),
      );
      await userEvent
        .setup()
        .click(screen.getAllByRole('button', { name: /revoke/i })[0]);
      await waitFor(() => expect(h.getAccount).toHaveBeenCalledTimes(2));
      return { view, release: () => release() };
    }

    it('revokes once it returns when nothing changed (the harness can)', async () => {
      const { release } = await revokeWithReadHeld();
      release();
      await waitFor(() =>
        expect(h.broadcastOperations).toHaveBeenCalledTimes(1),
      );
    });

    it('a user who left meanwhile gets no on-chain change', async () => {
      const { view, release } = await revokeWithReadHeld();
      view.unmount();
      release();
      await new Promise((r) => setTimeout(r, 30));
      expect(h.broadcastOperations).not.toHaveBeenCalled();
    });

    it('nor does one whose other tab selected someone else', async () => {
      const { release } = await revokeWithReadHeld();
      await addAccount('bob', { active: '5Kbob' });
      selectAccount('bob');
      release();
      await new Promise((r) => setTimeout(r, 30));
      expect(h.broadcastOperations).not.toHaveBeenCalled();
    });
  });

  it('a fresh read that finds no account stops the revoke and says so', async () => {
    await addAccount('alice', { active: '5Kactive' });
    renderPage();
    await screen.findByText('@ecency.app');
    h.getAccount.mockResolvedValue(null);
    await userEvent
      .setup()
      .click(screen.getAllByRole('button', { name: /revoke/i })[0]);
    expect(await screen.findByRole('alert')).toHaveTextContent(
      i18n.t('common.try_again'),
    );
    expect(h.broadcastOperations).not.toHaveBeenCalled();
  });

  it('a failed read before a revoke stops it and says so', async () => {
    await addAccount('alice', { active: '5Kactive' });
    renderPage();
    await screen.findByText('@ecency.app');
    h.getAccount.mockRejectedValue(new Error('node down'));
    await userEvent
      .setup()
      .click(screen.getAllByRole('button', { name: /revoke/i })[0]);
    expect(await screen.findByRole('alert')).toHaveTextContent(
      i18n.t('authorize.read_failed'),
    );
    expect(h.broadcastOperations).not.toHaveBeenCalled();
    expect(screen.getByText('@ecency.app')).toBeInTheDocument();
  });

  it('says so when nothing is authorized', async () => {
    h.getAccount.mockResolvedValue({
      ...account,
      posting: { ...account.posting, account_auths: [] },
    });
    await addAccount('alice', { active: '5Kactive' });
    renderPage();
    expect(
      await screen.findByText(/no apps are authorized/i),
    ).toBeInTheDocument();
  });

  it('surfaces a failed broadcast as an alert and keeps the list', async () => {
    await addAccount('alice', { active: '5Kactive' });
    h.broadcastOperations.mockRejectedValue(
      new Error('missing active authority'),
    );
    renderPage();
    await screen.findByText('@ecency.app');
    await userEvent
      .setup()
      .click(screen.getAllByRole('button', { name: /revoke/i })[0]);
    expect(await screen.findByRole('alert')).toHaveTextContent(
      /missing active authority/,
    );
    expect(screen.getByText('@ecency.app')).toBeInTheDocument();
  });
});
