import { describe, expect, it } from 'vitest';
import {
  sanitizeBreadcrumb,
  sanitizeEvent,
  scrubText,
  stripUrl,
} from './sentry';

// These are the guards that stop a signer uploading its users' credentials to a
// third party. In this app the URL IS the credential: a consent redirect carries
// ?access_token=<posts as the user for a week>, and a sign request carries the
// whole operation base64'd in its path.

describe('stripUrl', () => {
  it('drops the query, where the token lives', () => {
    expect(
      stripUrl('https://app.example/cb?access_token=SECRET&username=alice'),
    ).toBe('https://app.example/cb');
  });

  it('drops the fragment too', () => {
    expect(stripUrl('https://signer.example/login#access_token=SECRET')).toBe(
      'https://signer.example/login',
    );
  });

  it('keeps a bare path usable for debugging', () => {
    expect(stripUrl('/oauth2/authorize?client_id=theapp')).toBe(
      '/oauth2/authorize',
    );
  });

  it('never throws on a non-URL', () => {
    expect(stripUrl('not a url at all')).toBe('not a url at all');
    expect(stripUrl('')).toBe('');
  });
});

describe('scrubText', () => {
  it('redacts a WIF private key', () => {
    const wif = '5KT3LKgkovUYzQVSX3WpEGZ4rdazyotpi6piwvdFMxx9eiv8gRL';
    const out = scrubText(`failed to parse ${wif} for alice`);
    expect(out).not.toContain(wif);
    expect(out).toContain('[redacted]');
  });

  it('redacts a Hive public key', () => {
    const pub = 'STM4tb8Quiasc1qFoxqAkA72zug5bTUbZxAFBzDV43LXoBBRZdXkS';
    expect(scrubText(`signer ${pub}`)).not.toContain(pub);
  });

  it('redacts credential-carrying parameters but keeps their names', () => {
    const out = scrubText(
      'GET /cb?access_token=eyJhbGciOi.abc&code=XYZ123&username=alice',
    );
    expect(out).not.toContain('eyJhbGciOi.abc');
    expect(out).not.toContain('XYZ123');
    expect(out).toContain('access_token=[redacted]');
    expect(out).toContain('code=[redacted]');
    // Non-secret context survives, or the report is useless.
    expect(out).toContain('username=alice');
  });

  it('redacts a passcode and a password', () => {
    const out = scrubText('passcode: hunter2 password=letmein');
    expect(out).not.toContain('hunter2');
    expect(out).not.toContain('letmein');
  });

  it('redacts an encoded operation payload from a sign path', () => {
    const out = scrubText('navigated to /sign/op/eyJ0byI6ImF0dGFja2VyIn0');
    expect(out).not.toContain('eyJ0byI6ImF0dGFja2VyIn0');
    expect(out).toContain('[redacted]');
  });

  it('leaves ordinary text alone', () => {
    expect(scrubText('TypeError: cannot read property of undefined')).toBe(
      'TypeError: cannot read property of undefined',
    );
  });
});

describe('sanitizeEvent', () => {
  it('strips the request URL, query_string and referrer', () => {
    const out = sanitizeEvent({
      request: {
        url: 'https://signer.example/oauth2/authorize?access_token=SECRET',
        query_string: 'access_token=SECRET',
        headers: { Referer: 'https://app.example/start?code=ABC' },
      },
    } as never);
    expect(out.request?.url).toBe('https://signer.example/oauth2/authorize');
    expect(out.request?.query_string).toBeUndefined();
    expect((out.request?.headers as Record<string, string>).Referer).toBe(
      'https://app.example/start',
    );
    expect(JSON.stringify(out)).not.toContain('SECRET');
    expect(JSON.stringify(out)).not.toContain('ABC');
  });

  it('scrubs secrets nested anywhere in the event', () => {
    const wif = '5KT3LKgkovUYzQVSX3WpEGZ4rdazyotpi6piwvdFMxx9eiv8gRL';
    const out = sanitizeEvent({
      exception: {
        values: [{ type: 'Error', value: `bad key ${wif}` }],
      },
      extra: { deep: { deeper: [`access_token=SECRET`] } },
    } as never);
    const json = JSON.stringify(out);
    expect(json).not.toContain(wif);
    expect(json).not.toContain('SECRET');
  });

  it('survives a cyclic event instead of throwing (a throw drops the event)', () => {
    const cyclic: Record<string, unknown> = { extra: {} };
    (cyclic.extra as Record<string, unknown>).self = cyclic;
    expect(() => sanitizeEvent(cyclic as never)).not.toThrow();
  });
});

describe('sanitizeBreadcrumb', () => {
  it('drops console and user-input breadcrumbs entirely', () => {
    expect(sanitizeBreadcrumb({ category: 'console' } as never)).toBeNull();
    expect(sanitizeBreadcrumb({ category: 'ui.input' } as never)).toBeNull();
  });

  it('strips URLs from navigation and fetch breadcrumbs', () => {
    const out = sanitizeBreadcrumb({
      category: 'navigation',
      data: {
        from: '/login?redirect=/profile',
        to: '/oauth2/authorize?access_token=SECRET',
      },
    } as never);
    expect(out?.data?.from).toBe('/login');
    expect(out?.data?.to).toBe('/oauth2/authorize');
    expect(JSON.stringify(out)).not.toContain('SECRET');
  });

  it('strips the url field of an http breadcrumb', () => {
    const out = sanitizeBreadcrumb({
      category: 'fetch',
      data: { url: 'https://api.example/x?token=SECRET' },
    } as never);
    expect(out?.data?.url).toBe('https://api.example/x');
  });
});
