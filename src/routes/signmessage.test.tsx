import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentType } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import i18n from '../i18n';

vi.mock('@tanstack/react-router', async () =>
  (await import('../test-router-mock')).routerMock(),
);

import { PrivateKey } from '@ecency/sdk/hive';
import { _resetKeyCache, addAccount, lockAccount } from '@/lib/accounts';
import { decodeToken } from '@/lib/message-token';
import { Route } from './signmessage';

const SignMessage = (Route as unknown as { component: ComponentType })
  .component;

// Real keys, real signing: the point of this page is the signature.
const posting = PrivateKey.fromSeed('signmessage-test-posting');
const active = PrivateKey.fromSeed('signmessage-test-active');

beforeEach(() => {
  localStorage.clear();
  _resetKeyCache();
});

describe('/signmessage', () => {
  it('asks to log in when no unlocked account holds a key', () => {
    render(<SignMessage />);
    expect(
      screen.getByText(i18n.t('message_signing.login_prompt')),
    ).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(screen.getByRole('link', { name: /login/i })).toHaveAttribute(
      'href',
      '/accounts',
    );
  });

  it('a locked account is unlocked here, then the form shows (#146)', async () => {
    await addAccount('alice', { posting: posting.toString() }, 'pass');
    lockAccount('alice');
    const user = userEvent.setup();
    render(<SignMessage />);
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(screen.queryByRole('link', { name: /login/i })).toBeNull();
    // The passcode is all that is asked: no "log in and choose a key".
    expect(
      screen.queryByText(i18n.t('message_signing.login_prompt')),
    ).toBeNull();
    await user.type(screen.getByLabelText(i18n.t('accounts.passcode')), 'pass');
    await user.click(screen.getByRole('button', { name: /^unlock$/i }));
    expect(
      await screen.findByRole('textbox', {}, { timeout: 10_000 }),
    ).toBeInTheDocument();
  }, 30_000);

  it('signs with the chosen authority and produces a token that recovers the signer', async () => {
    await addAccount('alice', {
      posting: posting.toString(),
      active: active.toString(),
    });
    render(<SignMessage />);
    const user = userEvent.setup();
    const button = screen.getByRole('button', { name: /sign/i });
    expect(button).toBeDisabled();
    await user.type(screen.getByRole('textbox'), 'hello hive');
    await user.selectOptions(screen.getByRole('combobox'), 'posting');
    await user.click(button);
    expect(screen.getByText('@alice')).toBeInTheDocument();
    expect(
      screen.getByText(i18n.t('message_signing.authority_used'))
        .nextElementSibling,
    ).toHaveTextContent(i18n.t('authority.posting'));
    const [token] = screen.getAllByRole('code').map((c) => c.textContent ?? '');
    const decoded = decodeToken(token);
    expect(decoded?.payload.authors).toEqual(['alice']);
    expect(decoded?.payload.signed_message).toEqual({ message: 'hello hive' });
    expect(decoded?.signer).toBe(posting.createPublic().toString());
    // The verification link carries the same token.
    expect(
      screen.getByText(
        new RegExp(`/verifymessage\\?payload=${token.slice(0, 20)}`),
      ),
    ).toBeInTheDocument();
  });

  it('offers only the authorities the account actually holds', async () => {
    await addAccount('alice', { active: active.toString() });
    render(<SignMessage />);
    const options = screen.getAllByRole('option').map((o) => o.textContent);
    expect(options).toEqual([i18n.t('authority.active')]);
    expect(screen.getByRole('combobox')).toHaveValue('active');
  });
});
