import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
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

import { KEYBOARD_SETTLE_MS, LanguageSelect } from './LanguageSelect';

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
    await waitFor(() => expect(onPicked).toHaveBeenCalledWith(true, 'de'));
    expect(i18n.language).toBe('de');
    expect(localStorage.getItem('hs_lang')).toBe('de');
    expect(screen.getByRole('combobox')).toHaveValue('de');
  });

  it('shows the language the page is in again when a pick cannot be applied', async () => {
    const onPicked = vi.fn();
    render(<LanguageSelect onPicked={onPicked} />);
    h.failNext = true;
    await userEvent.setup().selectOptions(screen.getByRole('combobox'), 'ja');
    await waitFor(() => expect(onPicked).toHaveBeenCalledWith(false, 'ja'));
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
    expect(onPicked.mock.calls).toEqual([[true, 'it']]);
    expect(screen.queryByRole('status')).toBeNull();
    expect(screen.getByRole('combobox')).toHaveValue('it');
  });

  it('shows a pick while its dictionary is on the way', async () => {
    render(<LanguageSelect />);
    h.slowNext = true;
    await userEvent.setup().selectOptions(screen.getByRole('combobox'), 'fa');
    expect(screen.getByRole('combobox')).toHaveValue('fa');
    expect(i18n.language).toBe('en');
    h.finishSlow();
  });

  it('does not switch the page while the keyboard moves through the list', async () => {
    render(<LanguageSelect />);
    const menu = screen.getByRole('combobox');
    for (const value of ['ar', 'bg', 'bn']) {
      fireEvent.keyDown(menu, { key: 'ArrowDown' });
      fireEvent.change(menu, { target: { value } });
    }
    expect(menu).toHaveValue('bn');
    expect(i18n.language).toBe('en');
    expect(localStorage.getItem('hs_lang')).toBeNull();
    // Enter applies what is showing.
    fireEvent.keyDown(menu, { key: 'Enter' });
    await waitFor(() => expect(i18n.language).toBe('bn'));
    expect(localStorage.getItem('hs_lang')).toBe('bn');
  });

  it('applies a keyboard choice when the menu loses focus, or once the keys rest', async () => {
    render(<LanguageSelect />);
    const menu = screen.getByRole('combobox');
    fireEvent.keyDown(menu, { key: 'ArrowUp' });
    fireEvent.change(menu, { target: { value: 'de' } });
    fireEvent.blur(menu);
    await waitFor(() => expect(i18n.language).toBe('de'));

    fireEvent.keyDown(menu, { key: 'ArrowDown' });
    fireEvent.change(menu, { target: { value: 'es' } });
    expect(i18n.language).toBe('de');
    await waitFor(() => expect(i18n.language).toBe('es'), {
      timeout: KEYBOARD_SETTLE_MS + 1000,
    });
  });

  it('applies a pointer pick at once, even after the keyboard was used', async () => {
    render(<LanguageSelect />);
    const menu = screen.getByRole('combobox');
    fireEvent.keyDown(menu, { key: 'Tab' });
    fireEvent.change(menu, { target: { value: 'it' } });
    await waitFor(() => expect(i18n.language).toBe('it'));
    fireEvent.keyDown(menu, { key: 'ArrowDown' });
    fireEvent.pointerDown(menu);
    fireEvent.change(menu, { target: { value: 'ja' } });
    await waitFor(() => expect(i18n.language).toBe('ja'));
  });

  it('follows a language changed elsewhere', async () => {
    render(<LanguageSelect />);
    await act(() => i18n.changeLanguage('ko'));
    expect(screen.getByRole('combobox')).toHaveValue('ko');
  });
});
