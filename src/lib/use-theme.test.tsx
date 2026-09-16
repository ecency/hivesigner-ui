import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { _resetSessionTheme } from './theme';
import { useTheme } from './use-theme';

beforeEach(() => {
  localStorage.clear();
  _resetSessionTheme();
  document.documentElement.removeAttribute('data-theme');
});

describe('useTheme', () => {
  it('starts on the system theme and follows an explicit choice', () => {
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe('system');
    act(() => result.current.setTheme('dark'));
    expect(result.current.theme).toBe('dark');
    expect(result.current.isDark).toBe(true);
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    act(() => result.current.setTheme('light'));
    expect(result.current.isDark).toBe(false);
    act(() => result.current.setTheme('system'));
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
  });

  it('keeps every subscriber in step', () => {
    const a = renderHook(() => useTheme());
    const b = renderHook(() => useTheme());
    act(() => a.result.current.setTheme('dark'));
    expect(b.result.current.theme).toBe('dark');
  });
});
