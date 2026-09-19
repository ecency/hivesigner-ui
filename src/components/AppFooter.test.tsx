import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { switchLanguage } from '../i18n';

vi.mock('@tanstack/react-router', async () =>
  (await import('../test-router-mock')).routerMock(),
);
const h = vi.hoisted(() => ({ failNext: false }));
vi.mock('@/i18n', async (importOriginal) => {
  const real = await importOriginal<typeof import('@/i18n')>();
  return {
    ...real,
    switchLanguage: (...args: Parameters<typeof real.switchLanguage>) => {
      if (h.failNext) {
        h.failNext = false;
        return Promise.resolve(false);
      }
      return real.switchLanguage(...args);
    },
  };
});
// German has docs of its own here; Japanese does not.
vi.mock('@/docs/content', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/docs/content')>()),
  DOC_LANGUAGES: ['en', 'de'],
}));

import { routerState } from '../test-router-mock';
import { AppFooter } from './AppFooter';

describe('AppFooter', () => {
  it('links every destination that is not a section of the app', () => {
    render(<AppFooter />);
    const hrefs = screen
      .getAllByRole('link')
      .map((a) => a.getAttribute('href'));
    for (const to of [
      '/apps',
      '/accounts',
      '/signs',
      '/authorized-apps',
      '/signmessage',
      '/verifymessage',
      '/settings',
      '/about',
      '/docs',
      'https://github.com/ecency/hivesigner-ui',
    ]) {
      expect(hrefs, `missing ${to}`).toContain(to);
    }
  });

  it('opens external links safely', () => {
    render(<AppFooter />);
    for (const a of screen.getAllByRole('link')) {
      if (a.getAttribute('href')?.startsWith('http')) {
        expect(a).toHaveAttribute('target', '_blank');
        expect(a.getAttribute('rel')).toContain('noopener');
      }
    }
  });

  it('credits Ecency in a readable sentence and is not a nav landmark', () => {
    render(<AppFooter />);
    expect(screen.getByText(/built with/i).textContent).toMatch(
      /Built with ♥ by the Ecency team/,
    );
    expect(screen.getByText('Ecency').closest('a')).toHaveAttribute(
      'href',
      'https://ecency.com',
    );
    expect(screen.queryByRole('navigation')).toBeNull();
  });

  it('offers the language menu on every page', () => {
    render(<AppFooter />);
    expect(
      screen.getByRole('combobox', { name: 'Language' }),
    ).toBeInTheDocument();
  });

  it('takes a docs page along to the language picked for the app', async () => {
    const user = userEvent.setup();
    // By role alone: its label changes with the language.
    const menu = () => screen.getByRole('combobox');
    routerState.pathname = '/docs/oauth2';
    routerState.navigate.mockReset();
    const view = render(<AppFooter />);
    await user.selectOptions(menu(), 'de');
    await waitFor(() =>
      expect(routerState.navigate).toHaveBeenCalledWith({
        href: '/docs/de/oauth2',
        replace: true,
      }),
    );
    // A language the docs do not have yet: the page in English.
    await user.selectOptions(menu(), 'ja');
    await waitFor(() =>
      expect(routerState.navigate).toHaveBeenLastCalledWith({
        href: '/docs/oauth2',
        replace: true,
      }),
    );
    // Anywhere else the page stays where it is.
    view.unmount();
    routerState.pathname = '/apps';
    routerState.navigate.mockReset();
    render(<AppFooter />);
    await user.selectOptions(menu(), 'de');
    await waitFor(() => expect(menu()).toHaveValue('de'));
    expect(routerState.navigate).not.toHaveBeenCalled();
    routerState.pathname = '/';
    await switchLanguage('en');
  });

  it("links the docs in the app's language when the docs have it", async () => {
    render(<AppFooter />);
    const docs = () =>
      screen
        .getAllByRole('link')
        .find((a) => a.getAttribute('href')?.startsWith('/docs'));
    expect(docs()).toHaveAttribute('href', '/docs');
    await switchLanguage('de');
    await waitFor(() => expect(docs()).toHaveAttribute('href', '/docs/de'));
    await switchLanguage('ja');
    await waitFor(() => expect(docs()).toHaveAttribute('href', '/docs'));
    await switchLanguage('en');
  });

  it('stays on the docs page when the picked language cannot load', async () => {
    routerState.pathname = '/docs/oauth2';
    routerState.navigate.mockReset();
    render(<AppFooter />);
    h.failNext = true;
    await userEvent.setup().selectOptions(screen.getByRole('combobox'), 'de');
    await waitFor(() => expect(screen.getByRole('status')).toBeInTheDocument());
    expect(routerState.navigate).not.toHaveBeenCalled();
    routerState.pathname = '/';
  });
});
