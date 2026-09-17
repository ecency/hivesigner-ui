import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import i18n from '../i18n';
import { LANGUAGES } from '../i18n/languages';

const h = vi.hoisted(() => ({
  failNext: false,
  slowNext: false,
  finishSlow: () => {},
}));
vi.mock('@/i18n', async (importOriginal) => {
  const real = await importOriginal<typeof import('@/i18n')>();
  return {
    ...real,
    switchLanguage: (...args: Parameters<typeof real.switchLanguage>) => {
      if (h.failNext) {
        h.failNext = false;
        return Promise.resolve(false);
      }
      if (h.slowNext) {
        // A pick that another one overtakes: it settles last, unapplied.
        h.slowNext = false;
        return new Promise<boolean>((resolve) => {
          h.finishSlow = () => resolve(false);
        });
      }
      return real.switchLanguage(...args);
    },
  };
});

import { LanguageSelect } from './LanguageSelect';

beforeEach(() => localStorage.clear());
afterEach(async () => {
  await act(() => i18n.changeLanguage('en'));
});

describe('LanguageSelect', () => {
  it('lists every language by its own name, marked with its language', () => {
    render(<LanguageSelect />);
    const menu = screen.getByRole('combobox', { name: 'Language' });
    expect(menu).toHaveAttribute('translate', 'no');
    expect(menu).toHaveValue('en');
    const options = screen.getAllByRole('option') as HTMLOptionElement[];
    expect(options.map((o) => [o.value, o.textContent])).toEqual(
      LANGUAGES.map((l) => [l.code, l.name]),
    );
    const arabic = options.find((o) => o.value === 'ar');
    expect(arabic).toHaveAttribute('lang', 'ar');
    expect(arabic).toHaveAttribute('dir', 'rtl');
    expect(options.find((o) => o.value === 'sr')).toHaveAttribute(
      'lang',
      'sr-Latn',
    );
  });

  it('switches to a picked language and remembers it', async () => {
    const onPicked = vi.fn();
    render(<LanguageSelect onPicked={onPicked} />);
    await userEvent.setup().selectOptions(screen.getByRole('combobox'), 'de');
    await waitFor(() => expect(onPicked).toHaveBeenCalledWith(true));
    expect(i18n.language).toBe('de');
    expect(localStorage.getItem('hs_lang')).toBe('de');
    expect(screen.getByRole('combobox')).toHaveValue('de');
  });

  it('shows the language the page is in again when a pick cannot be applied', async () => {
    const onPicked = vi.fn();
    render(<LanguageSelect onPicked={onPicked} />);
    h.failNext = true;
    await userEvent.setup().selectOptions(screen.getByRole('combobox'), 'ja');
    await waitFor(() => expect(onPicked).toHaveBeenCalledWith(false));
    expect(i18n.language).toBe('en');
    expect(screen.getByRole('combobox')).toHaveValue('en');
    expect(screen.getByRole('status')).toHaveTextContent(
      i18n.t('common.try_again'),
    );
    // A pick that works clears it.
    await userEvent.setup().selectOptions(screen.getByRole('combobox'), 'nl');
    await waitFor(() => expect(i18n.language).toBe('nl'));
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('answers only for the newest pick', async () => {
    const onPicked = vi.fn();
    render(<LanguageSelect onPicked={onPicked} />);
    const user = userEvent.setup();
    h.slowNext = true;
    await user.selectOptions(screen.getByRole('combobox'), 'fa');
    await user.selectOptions(screen.getByRole('combobox'), 'it');
    await waitFor(() => expect(i18n.language).toBe('it'));
    h.finishSlow();
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(onPicked.mock.calls).toEqual([[true]]);
    expect(screen.queryByRole('status')).toBeNull();
    expect(screen.getByRole('combobox')).toHaveValue('it');
  });

  it('follows a language changed elsewhere', async () => {
    render(<LanguageSelect />);
    await act(() => i18n.changeLanguage('ko'));
    expect(screen.getByRole('combobox')).toHaveValue('ko');
  });
});
