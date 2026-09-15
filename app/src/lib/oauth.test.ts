import { describe, expect, it, vi } from 'vitest';
import { decodeToken } from './message-token';
import {
  type AuthRequest,
  authorityForScope,
  buildAuthToken,
  buildRedirectUrl,
  isRegisteredRedirect,
  normalizeAuthRequest,
  normalizeLoginRequest,
} from './oauth';

const POSTING_WIF = '5KT3LKgkovUYzQVSX3WpEGZ4rdazyotpi6piwvdFMxx9eiv8gRL';
const POSTING_PUB = 'STM4tb8Quiasc1qFoxqAkA72zug5bTUbZxAFBzDV43LXoBBRZdXkS';

describe('normalizeAuthRequest', () => {
  it('keeps login scope', () => {
    const r = normalizeAuthRequest({ scope: 'login', client_id: 'ecency.app' });
    expect(r.scope).toBe('login');
    expect(r.responseType).toBe('token');
    expect(r.clientId).toBe('ecency.app');
  });

  it('forces posting + code for an offline scope', () => {
    const r = normalizeAuthRequest({ scope: 'login,offline' });
    expect(r.scope).toBe('posting');
    expect(r.responseType).toBe('code');
  });

  it('defaults an unknown scope to posting', () => {
    expect(normalizeAuthRequest({ scope: 'whatever' }).scope).toBe('posting');
  });

  it('takes the redirect_uri as given, because the router already decoded it', () => {
    // parseSearch (lib/search.ts) builds the query with URLSearchParams, so
    // values arrive percent-DECODED. This test models that input.
    const r = normalizeAuthRequest({
      scope: 'posting',
      redirect_uri: 'https://ecency.com/cb',
    });
    expect(r.redirectUri).toBe('https://ecency.com/cb');
  });

  it('does not decode a second time, which would corrupt an encoded callback', () => {
    // A registered callback whose query legitimately contains %2B: decoding
    // again turns it into '+' and the exact-match registration check then fails.
    const r = normalizeAuthRequest({
      scope: 'posting',
      redirect_uri: 'https://ecency.com/cb?next=a%2Bb',
    });
    expect(r.redirectUri).toBe('https://ecency.com/cb?next=a%2Bb');
  });
});

describe('isRegisteredRedirect', () => {
  const profile = { name: 'Ecency', redirectUris: ['https://ecency.com/cb'] };
  it('accepts an exact registered uri', () => {
    expect(isRegisteredRedirect(profile, 'https://ecency.com/cb')).toBe(true);
  });
  it('rejects an unregistered or malformed uri', () => {
    expect(isRegisteredRedirect(profile, 'https://evil.example/cb')).toBe(
      false,
    );
    expect(isRegisteredRedirect(profile, 'not a url')).toBe(false);
  });
});

describe('token issuance', () => {
  const req: AuthRequest = {
    clientId: 'ecency.app',
    redirectUri: 'https://ecency.com/cb',
    scope: 'posting',
    responseType: 'token',
  };

  it('builds a token that recovers to the signer and carries type+app', () => {
    const token = buildAuthToken(req, 'hivesignertest', POSTING_WIF, 'posting');
    const decoded = decodeToken(token);
    expect(decoded!.signer).toBe(POSTING_PUB);
    expect(decoded!.payload.signed_message).toEqual({
      type: 'posting',
      app: 'ecency.app',
    });
  });

  it('uses type "code" for the code flow', () => {
    const token = buildAuthToken(
      { ...req, responseType: 'code' },
      'hivesignertest',
      POSTING_WIF,
      'posting',
    );
    expect(
      (decodeToken(token)!.payload.signed_message as { type: string }).type,
    ).toBe('code');
  });

  it('maps scope to authority', () => {
    expect(authorityForScope('posting')).toBe('posting');
    expect(authorityForScope('login')).toBe('posting');
    expect(authorityForScope('active')).toBe('active');
  });
});

describe('buildRedirectUrl', () => {
  const base: AuthRequest = {
    scope: 'posting',
    responseType: 'token',
    state: 'xyz',
  };

  it('token flow: access_token + expires_in + state + username', () => {
    const url = new URL(
      buildRedirectUrl('https://ecency.com/cb', 'TOKEN', base, 'alice'),
    );
    expect(url.searchParams.get('access_token')).toBe('TOKEN');
    expect(url.searchParams.get('expires_in')).toBe('604800');
    expect(url.searchParams.get('state')).toBe('xyz');
    expect(url.searchParams.get('username')).toBe('alice');
    expect(url.searchParams.get('code')).toBeNull();
  });

  it('code flow: code + username, no access_token', () => {
    const url = new URL(
      buildRedirectUrl(
        'https://ecency.com/cb',
        'TOK',
        { ...base, responseType: 'code' },
        'alice',
      ),
    );
    expect(url.searchParams.get('code')).toBe('TOK');
    expect(url.searchParams.get('access_token')).toBeNull();
  });

  it('always appends a single ? even when the callback has none', () => {
    const url = buildRedirectUrl('https://ecency.com/cb', 'T', base, 'alice');
    expect(url.startsWith('https://ecency.com/cb?')).toBe(true);
  });
});

describe('redirect hardening (review findings)', () => {
  const profile = {
    name: 'Ecency',
    redirectUris: [
      'https://ecency.com/cb',
      'http://insecure.example/cb',
      'http://localhost:3000/cb',
    ],
  };

  it('refuses a plain-http callback: the token rides in the query string', () => {
    expect(isRegisteredRedirect(profile, 'http://insecure.example/cb')).toBe(
      false,
    );
  });

  it('still allows loopback http, where TLS is not available', () => {
    expect(isRegisteredRedirect(profile, 'http://localhost:3000/cb')).toBe(
      true,
    );
  });

  it('merges auth params into a callback that already has a query', () => {
    const url = buildRedirectUrl(
      'https://example.com/cb?tenant=1',
      'TOKEN',
      { scope: 'posting', responseType: 'token' },
      'alice',
    );
    const parsed = new URL(url);
    // The app's own param survives, and there is exactly one '?'.
    expect(parsed.searchParams.get('tenant')).toBe('1');
    expect(parsed.searchParams.get('access_token')).toBe('TOKEN');
    expect(parsed.searchParams.get('username')).toBe('alice');
    expect(url.split('?').length).toBe(2);
  });

  it('keeps a non-string profile name out of the render path', async () => {
    // An app account can publish any JSON in its own profile; an object name
    // rendered as a React child throws and takes the consent screen down.
    const { loadAppProfile } = await import('./oauth');
    const hive = await import('./hive');
    vi.spyOn(hive, 'getAccount').mockResolvedValue({
      name: 'theapp',
      posting_json_metadata: JSON.stringify({ profile: { name: { evil: 1 } } }),
    } as never);
    const p = await loadAppProfile('theapp');
    expect(typeof p?.name).toBe('string');
    expect(p?.name).toBe('theapp');
  });
});

describe('normalizeLoginRequest (legacy /login contract)', () => {
  it('accepts redirect as an alias for redirect_uri', () => {
    expect(
      normalizeLoginRequest({ redirect: 'https://ecency.com/cb' }).redirectUri,
    ).toBe('https://ecency.com/cb');
    // redirect_uri wins when both are present.
    expect(
      normalizeLoginRequest({
        redirect_uri: 'https://a.example/cb',
        redirect: 'https://b.example/cb',
      }).redirectUri,
    ).toBe('https://a.example/cb');
  });

  it('takes the client id from the path, clientId or client_id', () => {
    expect(normalizeLoginRequest({}, 'frompath').clientId).toBe('frompath');
    expect(normalizeLoginRequest({ clientId: 'a' }).clientId).toBe('a');
    expect(normalizeLoginRequest({ client_id: 'b' }).clientId).toBe('b');
  });

  it('falls back to LOGIN scope, not posting, for an unknown scope', () => {
    // This is the reason /login has its own normalizer: /oauth2/authorize falls
    // back to posting, so sharing one would silently turn a malformed legacy
    // request from a username-only login into a posting grant.
    expect(normalizeLoginRequest({ scope: 'whatever' }).scope).toBe('login');
    expect(normalizeLoginRequest({}).scope).toBe('login');
    expect(normalizeLoginRequest({ scope: 'posting' }).scope).toBe('posting');
    // Contrast, pinned so the divergence is deliberate and visible:
    expect(normalizeAuthRequest({ scope: 'whatever' }).scope).toBe('posting');
  });

  it('accepts only code or token as the response type', () => {
    expect(normalizeLoginRequest({ response_type: 'code' }).responseType).toBe(
      'code',
    );
    expect(normalizeLoginRequest({ response_type: 'wat' }).responseType).toBe(
      'token',
    );
    expect(normalizeLoginRequest({}).responseType).toBe('token');
  });

  it('does not let an offline scope upgrade a legacy request', () => {
    // normalizeAuthRequest forces posting+code for anything containing
    // 'offline'; the legacy route has no such rule, so it stays a login.
    const r = normalizeLoginRequest({ scope: 'login,offline' });
    expect(r.scope).toBe('login');
    expect(r.responseType).toBe('token');
  });
});

describe('buildRedirectUrl and callback fragments', () => {
  const req: AuthRequest = { scope: 'posting', responseType: 'token' };

  it('inserts params BEFORE a fragment, so the server actually receives them', () => {
    // Appending after '#' put the whole token inside the fragment, which a
    // browser never sends upstream: the app received no parameters at all.
    const url = buildRedirectUrl(
      'https://app.example/cb#done',
      'TOKEN',
      req,
      'alice',
    );
    const parsed = new URL(url);
    expect(parsed.searchParams.get('access_token')).toBe('TOKEN');
    expect(parsed.searchParams.get('username')).toBe('alice');
    expect(parsed.hash).toBe('#done');
    // The token must not be hiding in the fragment.
    expect(parsed.hash).not.toContain('TOKEN');
  });

  it('handles a fragment on a callback that already has a query', () => {
    const url = buildRedirectUrl(
      'https://app.example/cb?tenant=1#done',
      'TOKEN',
      req,
      'alice',
    );
    const parsed = new URL(url);
    expect(parsed.searchParams.get('tenant')).toBe('1');
    expect(parsed.searchParams.get('access_token')).toBe('TOKEN');
    expect(parsed.hash).toBe('#done');
  });

  it('still preserves the registered callback bytes exactly', () => {
    // Round-tripping through URL rewrote the app's own query (%20 -> +, a
    // valueless flag gaining '='), so a byte-comparing app saw a different URL.
    const url = buildRedirectUrl(
      'https://app.example/cb?q=%20x&flag',
      'TOKEN',
      req,
      'alice',
    );
    expect(url.startsWith('https://app.example/cb?q=%20x&flag&')).toBe(true);
  });
});
