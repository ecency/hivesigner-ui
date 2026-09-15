import { useSyncExternalStore } from 'react';
import {
  readSnapshot,
  setTheme,
  subscribeTheme,
  type Theme,
  themeSnapshot,
} from './theme';

/**
 * The theme preference and whether the page is currently dark, kept in step
 * across every control that shows it (the header switch, the settings radios).
 */
export function useTheme(): {
  theme: Theme;
  isDark: boolean;
  setTheme: (t: Theme) => void;
} {
  const snapshot = useSyncExternalStore(
    subscribeTheme,
    themeSnapshot,
    // Server snapshot. There is no SSR here, but React asks for it under
    // StrictMode's double render and a mismatching value would warn.
    () => 'system|light',
  );
  return { ...readSnapshot(snapshot), setTheme };
}
