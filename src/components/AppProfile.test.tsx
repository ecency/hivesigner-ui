import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import '../i18n';

const profile = vi.hoisted(() => ({ current: null as unknown }));
vi.mock('@tanstack/react-query', () => ({
  useQuery: () => ({ data: profile.current }),
}));
vi.mock('@tanstack/react-router', () => ({
  Link: ({ children }: { children: unknown }) => children,
}));

import { AppProfile, parseWebsite } from './AppProfile';

// The website comes out of the app account's own posting_json_metadata, so it
// is attacker-controlled text that ends up in an href on the screen that hands
// over posting authority.
describe('parseWebsite', () => {
  it('accepts a normal https URL and reports the host', () => {
    expect(parseWebsite('https://ecency.com')).toEqual({
      href: 'https://ecency.com/',
      host: 'ecency.com',
    });
  });

  // Plenty of these profiles store a bare domain rather than a URL.
  it('assumes https for a bare domain', () => {
    expect(parseWebsite('actifit.io')).toEqual({
      href: 'https://actifit.io/',
      host: 'actifit.io',
    });
    expect(parseWebsite('  worldmappin.com  ')).toEqual({
      href: 'https://worldmappin.com/',
      host: 'worldmappin.com',
    });
  });

  it('keeps a port and path visible in the host and href', () => {
    const r = parseWebsite('https://blog.engrave.dev:8443/x');
    expect(r?.host).toBe('blog.engrave.dev:8443');
    expect(r?.href).toBe('https://blog.engrave.dev:8443/x');
  });

  it('allows plain http, which some older apps still publish', () => {
    expect(parseWebsite('http://example.org')?.href).toBe(
      'http://example.org/',
    );
  });

  // The whole point of the gate.
  it.each([
    'javascript:alert(1)',
    'JavaScript:alert(1)',
    'data:text/html,<script>alert(1)</script>',
    'vbscript:msgbox(1)',
    'file:///etc/passwd',
    'blob:https://evil.example/x',
  ])('refuses the %s scheme', (value) => {
    expect(parseWebsite(value)).toBeNull();
  });

  // THE case that makes the protocol check load-bearing. Every payload above
  // parses to an EMPTY hostname, so the "must contain a dot" check alone
  // rejects them and deleting the protocol check failed no test. This one has
  // hostname "evil.example", passes that check, and without the protocol check
  // would put a javascript: href on the screen that grants posting authority.
  it('refuses a javascript: URL that carries a real-looking hostname', () => {
    expect(parseWebsite('javascript://evil.example/%0aalert(1)')).toBeNull();
  });

  it('refuses things that are not addresses at all', () => {
    for (const v of [
      undefined,
      '',
      '   ',
      'not a website',
      'localhost',
      '???',
    ]) {
      expect(parseWebsite(v), String(v)).toBeNull();
    }
  });

  // A display name cannot be substituted for the destination: the HOST is what
  // gets rendered, so a URL whose path pretends to be another site still shows
  // where it actually goes.
  it('reports the real host even when the path imitates another site', () => {
    const r = parseWebsite('https://evil.example/ecency.com/login');
    expect(r?.host).toBe('evil.example');
  });

  it('reports the real host for a userinfo trick', () => {
    const r = parseWebsite('https://ecency.com@evil.example/');
    expect(r?.host).toBe('evil.example');
  });
});

describe('AppProfile', () => {
  const WARNING = /Hivesigner does not verify/i;

  it('warns that the data is self-declared', () => {
    profile.current = { username: 'ecency.app', name: 'Ecency' };
    render(<AppProfile username="ecency.app" />);
    expect(screen.getByText(WARNING)).toBeInTheDocument();
  });

  // An `about` on its own is still a claim, and it sits directly above the
  // control that grants posting authority: "the official Hive wallet" with no
  // warning was possible while the warning keyed off site/creator/name only.
  it('warns for a profile that carries ONLY a description', () => {
    profile.current = {
      username: 'evil.app',
      about: 'The official Hive wallet, endorsed by Hivesigner.',
    };
    render(<AppProfile username="evil.app" />);
    expect(screen.getByText(WARNING)).toBeInTheDocument();
  });

  it('says nothing when the account published no profile at all', () => {
    profile.current = { username: 'bare.app' };
    render(<AppProfile username="bare.app" />);
    expect(screen.queryByText(WARNING)).not.toBeInTheDocument();
  });
});
