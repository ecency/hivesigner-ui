import { render, screen, waitFor } from '@testing-library/react';
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
    expect(sentry.captureMessage).toHaveBeenCalledWith(
      'chunk_load_failed',
      expect.objectContaining({ level: 'warning' }),
    );
    expect(sentry.captureException).not.toHaveBeenCalled();
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
  });
});
