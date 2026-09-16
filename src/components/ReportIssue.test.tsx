import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import '../i18n';

const h = vi.hoisted(() => ({ captureFeedback: vi.fn(), getClient: vi.fn() }));
vi.mock('@sentry/browser', () => ({
  captureFeedback: h.captureFeedback,
  getClient: h.getClient,
}));

import { ReportIssue } from './ReportIssue';

beforeEach(() => {
  h.captureFeedback.mockReset().mockReturnValue('abcdef1234567890');
  h.getClient.mockReset().mockReturnValue({});
  vi.stubGlobal('location', {
    pathname: '/sign/transfer',
    search: '?to=bob&amount=1%20HIVE&memo=hello&access_token=SECRET123&nb',
    origin: 'https://hivesigner.test',
    hostname: 'hivesigner.test',
  });
});

describe('ReportIssue', () => {
  it('sends the link the user opened with secrets blanked, plus their note, and confirms with a reference', async () => {
    render(
      <ReportIssue
        kind="sign_request_invalid"
        reason="invalid_field:amount"
        tags={{ op: 'transfer' }}
      />,
    );
    const user = userEvent.setup();
    await user.type(
      screen.getByRole('textbox'),
      'clicked from my app, got an error',
    );
    await user.click(screen.getByRole('button', { name: /report/i }));
    expect(h.captureFeedback).toHaveBeenCalledTimes(1);
    const [feedback, ctx] = h.captureFeedback.mock.calls[0];
    expect(feedback.message).toContain('kind: sign_request_invalid');
    expect(feedback.message).toContain('reason: invalid_field:amount');
    // memo is in the secret vocabulary (memos carry private content), so it
    // is blanked even though it is not a credential; the rest of the link is
    // exactly as opened.
    expect(feedback.message).toContain(
      'link: /sign/transfer?to=bob&amount=1%20HIVE&memo=[redacted]&access_token=[redacted]&nb',
    );
    expect(feedback.message).toContain('access_token=[redacted]');
    expect(feedback.message).not.toContain('SECRET123');
    expect(feedback.message).toContain('note: clicked from my app');
    expect(ctx.captureContext.tags).toEqual({
      report: 'user',
      kind: 'sign_request_invalid',
      op: 'transfer',
    });
    expect(screen.getByRole('status')).toHaveTextContent(/abcdef12/);
  });

  it('blanks a private key pasted into the note', async () => {
    const { PrivateKey } = await import('@ecency/sdk/hive');
    const wif = PrivateKey.fromSeed('report-test').toString();
    render(<ReportIssue kind="route_not_found" />);
    const user = userEvent.setup();
    await user.type(screen.getByRole('textbox'), `my key is ${wif}`);
    await user.click(screen.getByRole('button', { name: /report/i }));
    expect(h.captureFeedback.mock.calls[0][0].message).not.toContain(wif);
    expect(h.captureFeedback.mock.calls[0][0].message).toContain('[redacted]');
  });

  it('disappears rather than pretending when reporting is off', async () => {
    h.getClient.mockReturnValue(undefined);
    render(<ReportIssue kind="route_not_found" />);
    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: /report/i }));
    expect(h.captureFeedback).not.toHaveBeenCalled();
    expect(screen.queryByRole('button')).toBeNull();
  });
});
