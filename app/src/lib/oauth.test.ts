import { describe, expect, it } from 'vitest';
import { decodeToken } from './message-token';
import {
  type AuthRequest,
  authorityForScope,
  buildAuthToken,
  buildRedirectUrl,
  isRegisteredRedirect,
  normalizeAuthRequest,
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

  it('decodes an encoded redirect_uri', () => {
    const r = normalizeAuthRequest({
      scope: 'posting',
      redirect_uri: 'https%3A%2F%2Fecency.com%2Fcb',
    });
    expect(r.redirectUri).toBe('https://ecency.com/cb');
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
