import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { applyTheme, getTheme, initTheme, isDarkNow, setTheme } from './theme';

function matchMedia(dark: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({ matches: dark })),
  );
}

describe('theme preference', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    vi.unstubAllGlobals();
  });

  it('defaults to system', () => {
    expect(getTheme()).toBe('system');
  });

  it('round-trips an explicit choice', () => {
    setTheme('dark');
    expect(getTheme()).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  // The whole point of the CSS-first design: under `system` the attribute must
  // be ABSENT so the prefers-color-scheme rule applies from the first paint.
  // Writing data-theme="light" here would pin a dark-preferring visitor to a
  // white page.
  it('leaves the attribute off for system', () => {
    document.documentElement.setAttribute('data-theme', 'dark');
    applyTheme('system');
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
  });

  it('ignores a stored value that is not a theme', () => {
    localStorage.setItem('hs_theme', 'neon');
    expect(getTheme()).toBe('system');
  });

  it('survives storage being unavailable', () => {
    const get = vi
      .spyOn(Storage.prototype, 'getItem')
      .mockImplementation(() => {
        throw new Error('blocked');
      });
    const set = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        throw new Error('blocked');
      });
    expect(getTheme()).toBe('system');
    // Still applies for this page load even though it cannot be remembered.
    expect(() => setTheme('dark')).not.toThrow();
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    get.mockRestore();
    set.mockRestore();
  });

  it('initTheme applies what was stored', () => {
    localStorage.setItem('hs_theme', 'light');
    initTheme();
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  describe('isDarkNow', () => {
    it('follows the OS under system', () => {
      matchMedia(true);
      expect(isDarkNow()).toBe(true);
      matchMedia(false);
      expect(isDarkNow()).toBe(false);
    });

    it('lets an explicit choice override the OS in both directions', () => {
      matchMedia(true);
      applyTheme('light');
      expect(isDarkNow()).toBe(false);
      matchMedia(false);
      applyTheme('dark');
      expect(isDarkNow()).toBe(true);
    });
  });
});

describe('startup wiring', () => {
  // `initTheme` being correct is not enough: it has to be CALLED. It was not,
  // and the result was that an explicit dark choice was stored, the header
  // button read it back and said "Dark", and the page rendered light anyway -
  // the control claimed a mode the page was not in. Nothing in the unit tests
  // noticed, because every one of them called initTheme itself.
  const entry = readFileSync(resolve(process.cwd(), 'src/index.tsx'), 'utf8');

  it('the entry point applies the stored theme before rendering', () => {
    // Anchored to the start of a line so a commented-out call does not satisfy
    // it - the first version of this guard passed against `// initTheme();`.
    expect(entry).toMatch(/^initTheme\(\);$/m);
    const call = entry.search(/^initTheme\(\);$/m);
    expect(call).toBeLessThan(entry.indexOf('createRoot'));
  });
});

describe('globals.css dark blocks', () => {
  // globals.css carries the dark palette twice (see its comment): once for
  // prefers-color-scheme and once for [data-theme="dark"]. Nothing in the build
  // keeps them in step, and a token defined in only one of them would make the
  // theme switch disagree with the system preference on exactly that colour.
  // From the project root: under jsdom `import.meta.url` is an http URL, not a
  // file one, so it cannot be resolved to a path here.
  const css = readFileSync(resolve(process.cwd(), 'src/globals.css'), 'utf8');

  // The three palette blocks appear in this order; each one ends where the next
  // begins. Slicing between explicit boundaries avoids trying to brace-match
  // the nested media query.
  function tokensBetween(from: string, to: string): string[] {
    const start = css.indexOf(from);
    const end = css.indexOf(to);
    expect(start, `${from} not found in globals.css`).toBeGreaterThan(-1);
    expect(end, `${to} not found in globals.css`).toBeGreaterThan(start);
    return [...css.slice(start, end).matchAll(/(--hs-[a-z-]+)\s*:/g)]
      .map((m) => m[1])
      .sort();
  }

  const light = tokensBetween(':root {', 'DARK (1/2)');
  const media = tokensBetween('DARK (1/2)', 'DARK (2/2)');
  const attribute = tokensBetween('DARK (2/2)', '@theme inline');

  it('define the same tokens as each other', () => {
    expect(light.length).toBeGreaterThan(10);
    expect(media).toEqual(light);
    expect(attribute).toEqual(light);
  });

  it('are all exposed as Tailwind colours', () => {
    const themeBlock = css.slice(css.indexOf('@theme inline'));
    for (const token of light) {
      if (token === '--hs-shadow') continue;
      expect(themeBlock, `${token} is not in @theme`).toContain(
        `var(${token})`,
      );
    }
  });
});
