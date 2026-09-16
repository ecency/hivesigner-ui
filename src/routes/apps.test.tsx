import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentType } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import '../i18n';

vi.mock('@tanstack/react-router', async () =>
  (await import('../test-router-mock')).routerMock(),
);
const h = vi.hoisted(() => ({ fetchAppDirectory: vi.fn() }));
vi.mock('@/lib/app-directory', () => ({
  fetchAppDirectory: h.fetchAppDirectory,
}));

import { Route } from './apps';

const Apps = (Route as unknown as { component: ComponentType }).component;

function renderApps() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <Apps />
    </QueryClientProvider>,
  );
}

const directory = {
  updated_at: 'now',
  building: false,
  window_days: 7,
  featured: ['ecency.app', 'peakd.app'],
  apps: [
    {
      username: 'ecency.app',
      name: 'Ecency',
      about: 'Blog',
      site: 'ok',
      users: 5,
      requests: 9,
    },
    {
      username: 'peakd.app',
      name: 'PeakD',
      about: null,
      site: 'ok',
      users: 3,
      requests: 4,
    },
    // A name carrying a bidi override, which must not reach the DOM raw.
    {
      username: 'evil.app',
      name: 'Evil‮live',
      about: null,
      site: 'ok',
      users: 1,
      requests: 1,
    },
  ],
};

beforeEach(() => {
  h.fetchAppDirectory.mockReset();
});

describe('/apps', () => {
  it('lists featured and all apps, each linking to its grant page', async () => {
    h.fetchAppDirectory.mockResolvedValue(directory);
    renderApps();
    expect(
      await screen.findByRole('heading', { name: /featured/i }),
    ).toBeInTheDocument();
    const links = screen
      .getAllByRole('link')
      .map((a) => a.getAttribute('href'));
    expect(links.filter((l) => l === '/authorize/ecency.app')).toHaveLength(2);
    expect(screen.getByText(/3 apps/i)).toBeInTheDocument();
  });

  it('strips bidi control characters from an app-chosen name', async () => {
    h.fetchAppDirectory.mockResolvedValue(directory);
    renderApps();
    await screen.findAllByText('Ecency');
    expect(document.body.textContent).not.toContain('‮');
    // The override is replaced, not silently dropped, so the name still reads
    // as tampered with rather than as a clean "Evillive".
    expect(screen.getAllByText(/^Evil.live$/).length).toBeGreaterThan(0);
  });

  it('filters by name or account and hides the featured block while searching', async () => {
    h.fetchAppDirectory.mockResolvedValue(directory);
    renderApps();
    await screen.findAllByText('Ecency');
    const user = userEvent.setup();
    await user.type(screen.getByRole('searchbox'), 'peak');
    expect(screen.queryByRole('heading', { name: /featured/i })).toBeNull();
    expect(screen.getAllByText('PeakD')).toHaveLength(1);
    expect(screen.queryAllByText('Ecency')).toHaveLength(0);
    await user.clear(screen.getByRole('searchbox'));
    await user.type(screen.getByRole('searchbox'), 'zzz');
    expect(
      screen.getByText(/didn’t find any apps for "zzz"/),
    ).toBeInTheDocument();
  });

  it('says the directory is still being built rather than showing an empty list', async () => {
    h.fetchAppDirectory.mockResolvedValue({
      ...directory,
      building: true,
      apps: [],
      featured: [],
    });
    renderApps();
    expect(await screen.findByText(/still being built/i)).toBeInTheDocument();
  });

  it('shows an error with a retry when the directory is unreachable', async () => {
    h.fetchAppDirectory.mockRejectedValueOnce(new Error('down'));
    h.fetchAppDirectory.mockResolvedValueOnce(directory);
    renderApps();
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/could not reach/i);
    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: /try again/i }));
    await waitFor(() =>
      expect(screen.getAllByText('Ecency').length).toBeGreaterThan(0),
    );
  });
});
