import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentType } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import i18n from '../i18n';

vi.mock('@tanstack/react-router', async () =>
  (await import('../test-router-mock')).routerMock(),
);

import { getStoredLanguage } from '@/lib/prefs';
import { _resetSessionTheme, getTheme } from '@/lib/theme';
import { Route } from './settings';

const Settings = (Route as unknown as { component: ComponentType }).component;

beforeEach(() => {
  localStorage.clear();
  _resetSessionTheme();
  document.documentElement.removeAttribute('data-theme');
  i18n.changeLanguage('en');
});

describe('/settings', () => {
  it('changes and persists the language, and switches the dictionary', async () => {
    render(<Settings />);
    await userEvent
      .setup()
      .selectOptions(screen.getByRole('combobox', { name: 'Language' }), 'ru');
    await waitFor(() => expect(i18n.language).toBe('ru'));
    expect(getStoredLanguage()).toBe('ru');
    expect(screen.getByRole('status')).toBeInTheDocument();
    await i18n.changeLanguage('en');
  });

  it('offers the three theme values as one radio group and applies the choice', async () => {
    render(<Settings />);
    const radios = screen.getAllByRole('radio');
    expect(radios.map((r) => (r as HTMLInputElement).value)).toEqual([
      'system',
      'light',
      'dark',
    ]);
    await userEvent.setup().click(screen.getByRole('radio', { name: /dark/i }));
    expect(getTheme()).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(screen.getByRole('radio', { name: /dark/i })).toBeChecked();
  });
});
