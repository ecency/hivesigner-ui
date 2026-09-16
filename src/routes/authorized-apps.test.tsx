import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentType } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import '../i18n';

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

import { _resetKeyCache, addAccount } from '@/lib/accounts';
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

  it('offers unlock instead of revoke when the active key is not available', async () => {
    await addAccount('alice', { posting: '5Kposting' });
    renderPage();
    await screen.findByText('@ecency.app');
    expect(screen.queryByRole('button', { name: /revoke/i })).toBeNull();
    expect(screen.getAllByRole('link', { name: /unlock/i })[0]).toHaveAttribute(
      'href',
      '/accounts',
    );
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
