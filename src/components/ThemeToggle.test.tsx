import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { ThemeToggle } from './ThemeToggle';

describe('ThemeToggle', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  it('cycles system -> light -> dark -> system, applying each', async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);
    const button = screen.getByRole('button');
    const root = document.documentElement;

    // Starts on system: no attribute, so the CSS media query decides.
    expect(root.hasAttribute('data-theme')).toBe(false);

    await user.click(button);
    expect(root.getAttribute('data-theme')).toBe('light');
    expect(localStorage.getItem('hs_theme')).toBe('light');

    await user.click(button);
    expect(root.getAttribute('data-theme')).toBe('dark');
    expect(localStorage.getItem('hs_theme')).toBe('dark');

    await user.click(button);
    expect(root.hasAttribute('data-theme')).toBe(false);
    expect(localStorage.getItem('hs_theme')).toBe('system');
  });

  // The accessible name has to name the state it is IN as well as what the
  // press does, or a screen reader user cannot tell which of the three states
  // the single button is currently showing.
  it('names both the current state and the next one', async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);
    const button = screen.getByRole('button');

    expect(button).toHaveAccessibleName(
      /follows your device.*switch to.*light/i,
    );
    await user.click(button);
    expect(button).toHaveAccessibleName(/light.*switch to.*dark/i);
  });
});
