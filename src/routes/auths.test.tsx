import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentType } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import i18n from '../i18n';

vi.mock('@tanstack/react-router', async () =>
  (await import('../test-router-mock')).routerMock(),
);
const h = vi.hoisted(() => ({ getAccount: vi.fn() }));
vi.mock('@/lib/hive', () => ({ getAccount: h.getAccount }));

import { _resetKeyCache, addAccount, lockAccount } from '@/lib/accounts';
import { Route } from './auths';

const Auths = (Route as unknown as { component: ComponentType }).component;

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <Auths />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  localStorage.clear();
  _resetKeyCache();
  h.getAccount.mockReset();
  h.getAccount.mockResolvedValue({
    name: 'alice',
    owner: {
      weight_threshold: 1,
      account_auths: [['recovery.app', 1]],
      key_auths: [['STMowner', 1]],
    },
    active: {
      weight_threshold: 1,
      account_auths: [],
      key_auths: [['STMactive', 1]],
    },
    posting: {
      weight_threshold: 1,
      account_auths: [['ecency.app', 1]],
      key_auths: [['STMposting', 1]],
    },
    posting_json_metadata: '{}',
  });
});

describe('/auths', () => {
  it('asks to log in when no account is selected', () => {
    renderPage();
    expect(screen.getByRole('link', { name: /login/i })).toHaveAttribute(
      'href',
      '/accounts',
    );
  });

  it('shows each authority with its keys and account delegations', async () => {
    await addAccount('alice', { posting: '5Kposting' });
    renderPage();
    expect(await screen.findByText(/STMposting/)).toBeInTheDocument();
    expect(screen.getByText(/STMactive/)).toBeInTheDocument();
    expect(screen.getByText(/STMowner/)).toBeInTheDocument();
    // A posting delegation can be revoked here; an owner one cannot, and says so.
    expect(screen.getByRole('link', { name: /revoke/i })).toHaveAttribute(
      'href',
      '/revoke/ecency.app',
    );
    expect(
      screen.getByText(/owner delegation: remove it with your owner key/i),
    ).toBeInTheDocument();
  });

  it('reveals a held private key only on request, and only the held one', async () => {
    await addAccount('alice', { posting: '5KpostingSecret' });
    renderPage();
    await screen.findByText(/STMposting/);
    expect(screen.queryByText('5KpostingSecret')).toBeNull();
    const reveal = screen.getAllByRole('button', { name: /reveal/i });
    expect(reveal).toHaveLength(1);
    await userEvent.setup().click(reveal[0]);
    expect(screen.getByText('5KpostingSecret')).toBeInTheDocument();
  });

  it('a locked account is unlocked here, and its keys can then be shown (#146)', async () => {
    await addAccount('alice', { posting: '5Kposting' }, 'pass');
    lockAccount('alice');
    const user = userEvent.setup();
    renderPage();
    expect(screen.queryByRole('button', { name: /reveal/i })).toBeNull();
    await user.type(screen.getByLabelText(i18n.t('accounts.passcode')), 'pass');
    await user.click(screen.getByRole('button', { name: /^unlock$/i }));
    expect(
      await screen.findByRole(
        'button',
        { name: /reveal/i },
        { timeout: 10_000 },
      ),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText(i18n.t('accounts.passcode'))).toBeNull();
  }, 30_000);
});
