import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
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

import { _resetKeyCache, addAccount } from '@/lib/accounts';
import { Route } from './index';

const Home = (Route as unknown as { component: ComponentType }).component;

function renderHome() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <Home />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  localStorage.clear();
  _resetKeyCache();
  h.fetchAppDirectory.mockReset();
  h.fetchAppDirectory.mockResolvedValue({
    building: false,
    featured: ['ecency.app', 'peakd.app'],
    apps: [],
  });
});

describe('/', () => {
  it('sends a newcomer to key import and a returning user to their accounts', async () => {
    const { unmount } = renderHome();
    expect(
      screen.getByRole('link', { name: /set up hivesigner/i }),
    ).toHaveAttribute('href', '/import');
    unmount();
    await addAccount('alice', { posting: '5Ka' });
    renderHome();
    expect(
      screen.getByRole('link', { name: /your accounts/i }),
    ).toHaveAttribute('href', '/accounts');
  });

  it('shows the featured apps from the directory, linking to their grant pages', async () => {
    renderHome();
    const chip = await screen.findByRole('link', { name: /@peakd\.app/ });
    expect(chip).toHaveAttribute('href', '/authorize/peakd.app');
    expect(screen.getByRole('link', { name: /see all apps/i })).toHaveAttribute(
      'href',
      '/apps',
    );
  });

  it('renders nothing for "powering" while the directory is unreachable', async () => {
    h.fetchAppDirectory.mockRejectedValue(new Error('down'));
    renderHome();
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent(
      /sign in to hive apps/i,
    );
    expect(screen.queryByText(/powering apps/i)).toBeNull();
  });

  it('makes each promise once: no promise cards or chips between the hero and the trust strip', () => {
    renderHome();
    // The lede says it, the trust strip restates it in four words; nothing
    // in between repeats it.
    expect(screen.queryByText(/keys never leave this device/i)).toBeNull();
    expect(screen.queryByText(/keys stay on your device/i)).toBeNull();
    expect(screen.queryByText(/see what you are signing/i)).toBeNull();
    expect(screen.getByText(/local key storage/i)).toBeInTheDocument();
    expect(screen.getByText(/transaction preview/i)).toBeInTheDocument();
  });

  it('keeps the illustration to the shape of a request: ability titles, no explanations', () => {
    const { container } = renderHome();
    const picture = container.querySelector('figure [aria-hidden="true"]');
    expect(picture).toHaveTextContent(/post and comment/i);
    expect(picture).not.toHaveTextContent(
      /publish posts and comments on your behalf/i,
    );
    expect(picture).not.toHaveTextContent(/one posting-authority grant/i);
  });

  it('shows the consent illustration as a picture and the developer band', () => {
    const { container } = renderHome();
    expect(
      container.querySelector('figure [aria-hidden="true"]'),
    ).not.toBeNull();
    expect(
      screen.getByRole('link', { name: /developer docs/i }),
    ).toHaveAttribute('href', '/developers');
    expect(screen.getByRole('link', { name: /browse apps/i })).toHaveAttribute(
      'href',
      '/apps',
    );
  });
});
