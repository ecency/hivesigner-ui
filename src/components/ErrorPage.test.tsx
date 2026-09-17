import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StrictMode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import i18n from '../i18n';

vi.mock('@tanstack/react-router', async () =>
  (await import('../test-router-mock')).routerMock(),
);
const sentry = vi.hoisted(() => ({
  captureException: vi.fn(() => 'exc-id'),
  captureMessage: vi.fn(() => 'msg-id'),
}));
vi.mock('@sentry/browser', () => ({
  ...sentry,
  captureFeedback: vi.fn(),
  getClient: () => undefined,
}));
const reload = vi.hoisted(() => ({ once: vi.fn() }));
const report = vi.hoisted(() => ({ send: vi.fn(() => 'feedback-id') }));
vi.mock('@/lib/sentry', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/sentry')>()),
  sendUserReport: report.send,
}));
vi.mock('@/lib/chunk-reload', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/chunk-reload')>()),
  reloadOnce: () => reload.once(),
}));

import { ErrorPage } from './ErrorPage';

const chunkError = Object.assign(new Error('Loading chunk 540 failed.'), {
  name: 'ChunkLoadError',
});

beforeEach(() => {
  sentry.captureException.mockClear();
  sentry.captureMessage.mockClear();
  reload.once.mockReset();
  report.send.mockClear();
  window.history.pushState({}, '', '/accounts');
});

describe('ErrorPage', () => {
  it('reloads once for a chunk that failed to load, and neither shows nor reports anything', async () => {
    reload.once.mockReturnValue(true);
    render(<ErrorPage error={chunkError} />);
    await waitFor(() => expect(reload.once).toHaveBeenCalled());
    expect(screen.queryByText(i18n.t('errors.something_wrong'))).toBeNull();
    expect(sentry.captureException).not.toHaveBeenCalled();
    expect(sentry.captureMessage).not.toHaveBeenCalled();
  });

  it('shows and reports a chunk failure that a reload did not fix, in a form monitoring keeps', async () => {
    reload.once.mockReturnValue(false);
    render(<ErrorPage error={chunkError} />);
    expect(
      await screen.findByText(i18n.t('errors.something_wrong')),
    ).toBeInTheDocument();
    // One issue for every route (the fingerprint), the route in the message.
    expect(sentry.captureMessage).toHaveBeenCalledWith(
      'chunk_load_failed: accounts',
      {
        level: 'warning',
        tags: { boundary: 'route' },
        fingerprint: ['chunk_load_failed'],
      },
    );
    expect(sentry.captureException).not.toHaveBeenCalled();
    // A report the user sends says what it was and points at that event.
    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: i18n.t('report.button') }));
    expect(report.send).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: 'chunk_load_failed',
        associatedEventId: 'msg-id',
      }),
    );
  });

  it('reloads once under Strict Mode, without showing or reporting in between', async () => {
    // The first effect run reloads and marks it; the second, which Strict
    // Mode adds, must not read that mark as a reload that already failed.
    reload.once.mockReturnValueOnce(true).mockReturnValue(false);
    render(
      <StrictMode>
        <ErrorPage error={chunkError} />
      </StrictMode>,
    );
    await waitFor(() => expect(reload.once).toHaveBeenCalled());
    await new Promise((r) => setTimeout(r, 20));
    expect(reload.once).toHaveBeenCalledTimes(1);
    expect(screen.queryByText(i18n.t('errors.something_wrong'))).toBeNull();
    expect(sentry.captureMessage).not.toHaveBeenCalled();
  });

  it('reports any other render error as it is, without reloading', async () => {
    const boom = new Error('boom');
    render(<ErrorPage error={boom} />);
    expect(
      await screen.findByText(i18n.t('errors.something_wrong')),
    ).toBeInTheDocument();
    expect(sentry.captureException).toHaveBeenCalledWith(boom, {
      tags: { boundary: 'route' },
    });
    expect(reload.once).not.toHaveBeenCalled();
    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: i18n.t('report.button') }));
    expect(report.send).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'render_error' }),
    );
  });
});
