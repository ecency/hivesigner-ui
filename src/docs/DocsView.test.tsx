import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import i18n, { switchLanguage } from '../i18n';

vi.mock('@tanstack/react-router', async () =>
  (await import('../test-router-mock')).routerMock(),
);

// German stands in for any translated language: it has one page of its own.
const h = vi.hoisted(() => ({ failPages: 0 }));
vi.mock('./content', async (importOriginal) => {
  const real = await importOriginal<typeof import('./content')>();
  const german = {
    sections: { users: 'Hivesigner benutzen' },
    pages: { accounts: { title: 'Konten', description: 'Konten verwalten.' } },
  };
  return {
    ...real,
    DOC_LANGUAGES: ['en', 'de'],
    loadDocIndex: async (lang: string) =>
      lang === 'de' ? german : real.loadDocIndex(lang),
    loadDocPage: async (lang: string, slug: 'accounts') => {
      if (h.failPages > 0) {
        h.failPages -= 1;
        throw new Error('offline');
      }
      return lang === 'de'
        ? {
            html: '<p>Ein Konto hinzufügen.</p><h2 id="add">Hinzufügen</h2>',
            headings: [{ level: 2, id: 'add', text: 'Hinzufügen' }],
            links: [],
          }
        : real.loadDocPage(lang, slug);
    },
  };
});

import { routerState } from '../test-router-mock';
import { DocsView } from './DocsView';

function show(lang: 'en' | 'de', slug: string, pathname: string) {
  routerState.pathname = pathname;
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <DocsView lang={lang} slug={slug as 'accounts'} />
    </QueryClientProvider>,
  );
}

const contents = () => screen.getByRole('navigation', { name: 'Contents' });

beforeEach(() => {
  // jsdom scrolls nothing and follows no links; the page asks for both.
  window.scrollTo = vi.fn() as never;
  document.head.innerHTML = '';
  routerState.navigate.mockReset();
  routerState.hash = '';
  h.failPages = 0;
});
afterEach(async () => {
  await switchLanguage('en');
});

describe('a docs page', () => {
  it('shows the page, its place in the contents and its own headings', async () => {
    show('en', 'oauth2', '/docs/oauth2');
    expect(
      screen.getByRole('heading', { level: 1, name: 'Sign in with OAuth2' }),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole('heading', { level: 2, name: 'Scopes' }),
    ).toHaveAttribute('id', 'scopes');
    const current = within(contents()).getByRole('link', {
      name: 'Sign in with OAuth2',
    });
    expect(current).toHaveAttribute('aria-current', 'page');
    expect(current).toHaveAttribute('href', '/docs/oauth2');
    // The page's own sections, under it.
    expect(
      within(contents()).getByRole('link', { name: 'Scopes' }),
    ).toHaveAttribute('href', '#scopes');
    expect(document.title).toBe('Sign in with OAuth2 · Hivesigner');
    expect(
      document.querySelector('link[rel="canonical"]')?.getAttribute('href'),
    ).toMatch(/\/docs\/oauth2$/);
    expect(screen.getByRole('article')).toHaveAttribute('lang', 'en');
  });

  it('lists every page by section on the docs home', async () => {
    show('en', 'index', '/docs');
    expect(
      await screen.findByRole('heading', {
        level: 2,
        name: 'Using Hivesigner',
      }),
    ).toBeInTheDocument();
    const card = screen
      .getAllByRole('link', { name: /Register your app/ })
      .find((a) => a.closest('article'));
    expect(card).toHaveAttribute('href', '/docs/register-app');
  });

  it('reads a translated page in its language, with links that stay in it', async () => {
    show('de', 'accounts', '/docs/de/accounts');
    expect(
      await screen.findByText('Ein Konto hinzufügen.'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 1, name: 'Konten' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('article')).toHaveAttribute('lang', 'de');
    expect(
      within(contents()).getByRole('link', { name: 'Konten' }),
    ).toHaveAttribute('href', '/docs/de/accounts');
    // A page it has not translated keeps its English title, in German space.
    expect(
      within(contents()).getByRole('link', { name: 'Tokens' }),
    ).toHaveAttribute('href', '/docs/de/tokens');
    expect(screen.getByText('Hivesigner benutzen')).toBeInTheDocument();
    expect(
      document.querySelector('link[rel="canonical"]')?.getAttribute('href'),
    ).toMatch(/\/docs\/de\/accounts$/);
  });

  it('shows English where a language has no translation, says so and keeps it out of search', async () => {
    show('de', 'oauth2', '/docs/de/oauth2');
    expect(
      await screen.findByRole('heading', { level: 2, name: 'Scopes' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('article')).toHaveAttribute('lang', 'en');
    expect(screen.getByRole('note')).toHaveTextContent(
      'This page is not available in Deutsch yet, so it is shown in English.',
    );
    await waitFor(() =>
      expect(
        document.querySelector('meta[name="robots"]')?.getAttribute('content'),
      ).toBe('noindex, nofollow'),
    );
    expect(document.querySelector('link[rel="canonical"]')).toBeNull();
  });

  it("offers the page in the reader's own language when it has one", async () => {
    await switchLanguage('de');
    show('en', 'accounts', '/docs/accounts');
    const note = await screen.findByRole('note');
    expect(within(note).getByRole('link', { name: 'Deutsch' })).toHaveAttribute(
      'href',
      '/docs/de/accounts',
    );
  });

  it('offers nothing when that language has no copy of the page', async () => {
    await switchLanguage('de');
    show('en', 'oauth2', '/docs/oauth2');
    await screen.findByRole('heading', { level: 2, name: 'Scopes' });
    expect(screen.queryByRole('note')).toBeNull();
  });

  it('says when a page could not be loaded and loads it again', async () => {
    h.failPages = 1;
    show('en', 'tokens', '/docs/tokens');
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(i18n.t('docs.load_failed'));
    await userEvent
      .setup()
      .click(within(alert).getByRole('button', { name: 'Retry' }));
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Tokens' }),
    ).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('alert')).toBeNull());
  });

  it('follows a link inside the page without reloading, unless asked for a new tab', async () => {
    show('en', 'oauth2', '/docs/oauth2');
    await screen.findByRole('heading', { level: 2, name: 'Scopes' });
    const link = document.querySelector<HTMLAnchorElement>(
      '.docs-prose a[href^="/docs/tokens"]',
    );
    if (!link) throw new Error('the page links to /docs/tokens');
    const user = userEvent.setup();
    await user.click(link);
    expect(routerState.navigate).toHaveBeenCalledWith({
      href: link.getAttribute('href'),
    });
    routerState.navigate.mockReset();
    // Left to the browser, which would open a new tab.
    const stay = (e: Event) => e.preventDefault();
    window.addEventListener('click', stay);
    await user.keyboard('{Control>}');
    await user.click(link);
    await user.keyboard('{/Control}');
    window.removeEventListener('click', stay);
    expect(routerState.navigate).not.toHaveBeenCalled();
  });
});
