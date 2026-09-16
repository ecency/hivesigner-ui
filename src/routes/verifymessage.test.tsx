import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentType } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import i18n from '../i18n';
import { routerState } from '../test-router-mock';

vi.mock('@tanstack/react-router', async () =>
  (await import('../test-router-mock')).routerMock(),
);
const h = vi.hoisted(() => ({ getAccount: vi.fn() }));
vi.mock('@/lib/hive', () => ({ getAccount: h.getAccount }));

import { PrivateKey } from '@ecency/sdk/hive';
import { createSignedMessage, encodeToken } from '@/lib/message-token';
import { Route } from './verifymessage';

const VerifyMessage = (Route as unknown as { component: ComponentType })
  .component;

const key = PrivateKey.fromSeed('verifymessage-test');
const pub = key.createPublic().toString();
const token = encodeToken(
  createSignedMessage({ message: 'hi' }, 'alice', key.toString(), 'posting'),
);

beforeEach(() => {
  routerState.search = {};
  h.getAccount.mockReset();
  h.getAccount.mockResolvedValue({
    name: 'alice',
    owner: { key_auths: [] },
    active: { key_auths: [] },
    posting: { key_auths: [[pub, 1]] },
    memo_key: 'STMmemo',
  });
});

describe('/verifymessage', () => {
  it('requires a token', async () => {
    render(<VerifyMessage />);
    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: /verify/i }));
    expect(await screen.findByText(/token is required/i)).toBeInTheDocument();
  });

  it('rejects a token that does not decode', async () => {
    render(<VerifyMessage />);
    const user = userEvent.setup();
    await user.type(screen.getByRole('textbox'), 'not-a-token');
    await user.click(screen.getByRole('button', { name: /verify/i }));
    expect(
      await screen.findByText(/invalid or incomplete/i),
    ).toBeInTheDocument();
  });

  it("confirms a signature against the author's on-chain keys and names the authority", async () => {
    render(<VerifyMessage />);
    const user = userEvent.setup();
    await user.type(screen.getByRole('textbox'), token);
    await user.click(screen.getByRole('button', { name: /verify/i }));
    expect(
      await screen.findByText(/signature is valid for alice/i),
    ).toBeInTheDocument();
    expect(screen.getByText('posting')).toBeInTheDocument();
    expect(screen.getByText(pub)).toBeInTheDocument();
  });

  it('reports a valid token whose key is not on the account as an invalid signature', async () => {
    h.getAccount.mockResolvedValue({
      name: 'alice',
      posting: { key_auths: [['STMother', 1]] },
    });
    render(<VerifyMessage />);
    const user = userEvent.setup();
    await user.type(screen.getByRole('textbox'), token);
    await user.click(screen.getByRole('button', { name: /verify/i }));
    expect(
      await screen.findByText(i18n.t('message_verification.invalid_signature')),
    ).toBeInTheDocument();
  });

  it('verifies automatically when opened from a verification link', async () => {
    routerState.search = { payload: token };
    render(<VerifyMessage />);
    await waitFor(() =>
      expect(
        screen.getByText(/signature is valid for alice/i),
      ).toBeInTheDocument(),
    );
  });

  it('says when the author account does not exist', async () => {
    h.getAccount.mockResolvedValue(null);
    render(<VerifyMessage />);
    const user = userEvent.setup();
    await user.type(screen.getByRole('textbox'), token);
    await user.click(screen.getByRole('button', { name: /verify/i }));
    expect(
      await screen.findByText(/account alice could not be found/i),
    ).toBeInTheDocument();
  });
});
