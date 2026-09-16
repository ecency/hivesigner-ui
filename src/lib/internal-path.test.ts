import { describe, expect, it } from 'vitest';
import { isAbsoluteHttpUrl, resolveInternalPath } from './internal-path';

// A "come back here afterwards" path from the URL is attacker-influenced. The
// checks resolve against our own origin rather than pattern-matching text.
describe('resolveInternalPath', () => {
  it('keeps a same-origin path with its query', () => {
    expect(resolveInternalPath('/profile?tab=1')).toEqual({
      pathname: '/profile',
      search: '?tab=1',
    });
  });

  it('refuses every off-site spelling', () => {
    for (const bad of [
      'https://evil.example/x',
      '//evil.example/x',
      '/\\evil.example/x',
      '\\/evil.example',
      '/..//evil.example',
      'javascript:alert(1)',
      '',
      undefined,
    ]) {
      expect(resolveInternalPath(bad), String(bad)).toBeNull();
    }
  });
});

describe('isAbsoluteHttpUrl', () => {
  it('accepts http and https only', () => {
    expect(isAbsoluteHttpUrl('https://a.example/cb')).toBe(true);
    expect(isAbsoluteHttpUrl('http://localhost:3000/cb')).toBe(true);
    expect(isAbsoluteHttpUrl('/relative')).toBe(false);
    expect(isAbsoluteHttpUrl('ftp://a.example')).toBe(false);
    expect(isAbsoluteHttpUrl(undefined)).toBe(false);
  });
});
