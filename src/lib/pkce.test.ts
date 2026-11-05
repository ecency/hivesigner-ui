import { afterEach, describe, expect, it, vi } from 'vitest';
import { decodeToken } from './message-token';
import {
  type AuthRequest,
  buildAuthToken,
  buildRedirectUrl,
  grantReturnTarget,
  isAppSchemeCallback,
  isRegisteredRedirect,
  isRegistrableRedirectUri,
  normalizeAuthRequest,
  normalizeLoginRequest,
  pkceChallenge,
} from './oauth';

// PKCE on the code flow (#164): a native app sends a S256 code_challenge, the
// challenge is signed INTO the code, and only then may the callback be a
// custom scheme such as myapp://cb. hivesigner-api checks the verifier.

const WIF = '5KT3LKgkovUYzQVSX3WpEGZ4rdazyotpi6piwvdFMxx9eiv8gRL';
// RFC 7636 appendix B.
const VERIFIER = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk';
const CHALLENGE = 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM';

// What alice signs for this request at 1800000000: these exact bytes, whose
// sha256 is the digest the signature covers. The signature itself is not
// fixed (the signer adds randomness), so a second signer (the Ecency app,
// vision-mobile #3641) matches the bytes and digest. See docs/pkce.
const GOLDEN_SIGNED_BYTES =
  '{"signed_message":{"type":"code","app":"myapp","code_challenge":"E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM","code_challenge_method":"S256"},"authors":["alice"],"timestamp":1800000000}';

const pkceQuery = {
  client_id: 'myapp',
  redirect_uri: 'myapp://cb',
  response_type: 'code',
  scope: 'posting',
  code_challenge: CHALLENGE,
  code_challenge_method: 'S256',
};
const req = (over: Record<string, string | undefined> = {}): AuthRequest =>
  normalizeAuthRequest({ ...pkceQuery, ...over } as Record<string, string>);
const profile = { redirectUris: ['myapp://cb', 'https://myapp.example/cb'] };

describe('pkceChallenge', () => {
  it('is the challenge of a code request with a well formed S256 challenge', () => {
    expect(pkceChallenge(req())).toBe(CHALLENGE);
  });

  it('is null for plain, a missing method, a malformed challenge, the token flow or no app', () => {
    expect(pkceChallenge(req({ code_challenge_method: 'plain' }))).toBeNull();
    expect(pkceChallenge(req({ code_challenge_method: undefined }))).toBeNull();
    expect(pkceChallenge(req({ code_challenge_method: 's256' }))).toBeNull();
    expect(pkceChallenge(req({ code_challenge: 'short' }))).toBeNull();
    expect(pkceChallenge(req({ code_challenge: `${CHALLENGE}=` }))).toBeNull();
    expect(pkceChallenge(req({ code_challenge: undefined }))).toBeNull();
    expect(pkceChallenge(req({ response_type: 'token' }))).toBeNull();
    expect(pkceChallenge(req({ client_id: undefined }))).toBeNull();
  });

  it('takes an app scheme from the legacy redirect alias when an app is named', () => {
    const legacy = normalizeLoginRequest({
      client_id: 'myapp',
      redirect: 'myapp://cb',
      response_type: 'code',
      code_challenge: CHALLENGE,
      code_challenge_method: 'S256',
    });
    expect(legacy.redirectUri).toBe('myapp://cb');
    // No app named: an app scheme is never a callback for a bare sign-in.
    expect(
      normalizeLoginRequest({ redirect: 'myapp://cb' }).redirectUri,
    ).toBeUndefined();
    expect(
      normalizeLoginRequest({
        client_id: 'myapp',
        redirect: 'javascript:alert(1)',
      }).redirectUri,
    ).toBeUndefined();
  });

  it('is read from the legacy /login query too', () => {
    const legacy = normalizeLoginRequest({ ...pkceQuery, scope: 'posting' });
    expect(pkceChallenge(legacy)).toBe(CHALLENGE);
  });
});

describe('custom scheme callbacks', () => {
  it('are registrable: an app scheme, reverse domain included', () => {
    for (const uri of [
      'myapp://cb',
      'myapp://hivesigner-token',
      'com.example.app:/oauth2redirect',
      'waves://hivesigner-auth?tenant=1',
    ]) {
      expect(isRegistrableRedirectUri(uri), uri).toBe(true);
      expect(isAppSchemeCallback(uri), uri).toBe(true);
    }
  });

  it('never include a scheme that runs or navigates in the browser, or a fragment', () => {
    for (const uri of [
      'javascript:alert(1)',
      'JavaScript:alert(1)',
      'data:text/html,<script>alert(1)</script>',
      'vbscript:msgbox(1)',
      'file:///etc/passwd',
      'blob:https://evil.example/1',
      'about:blank',
      'intent://cb#Intent;scheme=myapp;end',
      'view-source:https://evil.example',
      'filesystem:https://evil.example/x',
      'chrome://settings',
      'mailto:a@b.example',
      'tel:123',
      'ws://evil.example',
      'hive://sign/op',
      'myapp://cb#frag',
      'not a url',
      'http://evil.example/cb',
    ]) {
      expect(isRegistrableRedirectUri(uri), uri).toBe(false);
      expect(isAppSchemeCallback(uri), uri).toBe(false);
    }
  });

  it('refuse invisible, bidi or other non-ASCII characters that could spoof the consent screen', () => {
    for (const uri of [
      'myapp://cb/\u202emoc.ycnece',
      'myapp://cb\u200b',
      'myapp://c\u0430llback',
      'myapp://cb x',
      'myapp://cb\u0000',
    ])
      expect(isAppSchemeCallback(uri), JSON.stringify(uri)).toBe(false);
  });

  it('refuse browser, store and OS handler schemes, and any scheme shape but a plain or reverse domain name', () => {
    for (const uri of [
      'x-safari-https://evil.example',
      'googlechrome://evil.example',
      'googlechromes://evil.example',
      'microsoft-edge:https://evil.example',
      'firefox://open-url?url=https://evil.example',
      'opera://x',
      'web+evil://x',
      'ms-msdt:/id',
      'search-ms:query=x',
      'itms-services://?action=download-manifest',
      'itms-apps://x',
      'market://details?id=x',
      'shortcuts://run-shortcut?name=x',
      'facetime:123',
      'magnet:?xt=x',
      'smb://host/share',
      'shell:startup',
      'ms:x',
      'MyApp://cb',
      'my-app://cb',
      'my+app://cb',
    ])
      expect(isAppSchemeCallback(uri), uri).toBe(false);
    for (const uri of [
      'myapp2://cb',
      'com.example.my-app:/cb',
      'io.ecency.waves://auth',
    ])
      expect(isAppSchemeCallback(uri), uri).toBe(true);
  });

  it('keeps https and loopback registrable as before', () => {
    expect(isRegistrableRedirectUri('https://myapp.example/cb')).toBe(true);
    expect(isRegistrableRedirectUri('http://127.0.0.1/auth')).toBe(true);
  });

  it('are accepted only for a PKCE code request', () => {
    expect(isRegisteredRedirect(profile, 'myapp://cb', { pkce: true })).toBe(
      true,
    );
    expect(isRegisteredRedirect(profile, 'myapp://cb')).toBe(false);
    expect(isRegisteredRedirect(profile, 'myapp://cb', { pkce: false })).toBe(
      false,
    );
  });

  it('still need an exact registration', () => {
    for (const cb of [
      'myapp://cb/',
      'myapp://other',
      'MYAPP://cb',
      'myapp://cb?x=1',
    ])
      expect(isRegisteredRedirect(profile, cb, { pkce: true }), cb).toBe(false);
  });

  it('refuse a dangerous scheme even when another tool registered it', () => {
    const bad = { redirectUris: ['javascript:alert(1)', 'data:text/html,x'] };
    expect(
      isRegisteredRedirect(bad, 'javascript:alert(1)', { pkce: true }),
    ).toBe(false);
    expect(isRegisteredRedirect(bad, 'data:text/html,x', { pkce: true })).toBe(
      false,
    );
  });

  it('leave https callbacks working without PKCE', () => {
    expect(isRegisteredRedirect(profile, 'https://myapp.example/cb')).toBe(
      true,
    );
  });
});

describe('the PKCE code', () => {
  afterEach(() => vi.useRealTimers());

  it('signs the challenge into the code, in a fixed field order', () => {
    const token = buildAuthToken(req(), 'alice', WIF, 'posting');
    const decoded = decodeToken(token);
    expect(JSON.stringify(decoded?.payload.signed_message)).toBe(
      JSON.stringify({
        type: 'code',
        app: 'myapp',
        code_challenge: CHALLENGE,
        code_challenge_method: 'S256',
      }),
    );
    expect(decoded?.signer).toBe(
      'STM4tb8Quiasc1qFoxqAkA72zug5bTUbZxAFBzDV43LXoBBRZdXkS',
    );
  });

  it('signs the golden bytes other signers (the Ecency app) reproduce', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(1_800_000_000_000));
    const token = buildAuthToken(req(), 'alice', WIF, 'posting');
    const { signed_message, authors, timestamp } = decodeToken(token)!.payload;
    const bytes = JSON.stringify({ signed_message, authors, timestamp });
    expect(bytes).toBe(GOLDEN_SIGNED_BYTES);
    // decodeToken recovers the signer from the signature over sha256(bytes).
    expect(decodeToken(token)?.signer).toBe(
      'STM4tb8Quiasc1qFoxqAkA72zug5bTUbZxAFBzDV43LXoBBRZdXkS',
    );
    const digest = new Uint8Array(
      await crypto.subtle.digest('SHA-256', new TextEncoder().encode(bytes)),
    );
    expect(Buffer.from(digest).toString('hex')).toMatchInlineSnapshot(
      `"8de0c7bf487c57a3f4b3a616d139c4c6a4a1a61411c7cd222cd796d924c22836"`,
    );
  });

  it('says when the user approved sign-in only, so the exchange cannot give posting access', () => {
    const decoded = decodeToken(
      buildAuthToken(req({ scope: 'login' }), 'alice', WIF, 'posting'),
    );
    expect(JSON.stringify(decoded?.payload.signed_message)).toBe(
      JSON.stringify({
        type: 'code',
        app: 'myapp',
        scope: 'login',
        code_challenge: CHALLENGE,
        code_challenge_method: 'S256',
      }),
    );
    // Without PKCE too: a login-only code never stands for posting access.
    const plain = decodeToken(
      buildAuthToken(
        req({ scope: 'login', code_challenge: undefined }),
        'alice',
        WIF,
        'posting',
      ),
    );
    expect(plain?.payload.signed_message).toEqual({
      type: 'code',
      app: 'myapp',
      scope: 'login',
    });
  });

  it('carries no challenge when the request had none, or one that is not usable', () => {
    for (const over of [
      { code_challenge: undefined, code_challenge_method: undefined },
      { code_challenge_method: 'plain' },
      { code_challenge: 'short' },
    ]) {
      const decoded = decodeToken(
        buildAuthToken(req(over), 'alice', WIF, 'posting'),
      );
      expect(decoded?.payload.signed_message).toEqual({
        type: 'code',
        app: 'myapp',
      });
    }
  });

  it('is sent to a custom scheme callback in the query', () => {
    const url = buildRedirectUrl(
      'myapp://cb',
      'TOKEN',
      req({ state: 's1' }),
      'alice',
    );
    expect(url).toBe('myapp://cb?code=TOKEN&state=s1&username=alice');
  });
});

describe('the grant detour', () => {
  it('keeps the PKCE challenge on the way to consent', () => {
    const target = grantReturnTarget('myapp', {
      redirect_uri: 'https://myapp.example/cb',
      response_type: 'code',
      scope: 'posting',
      code_challenge: CHALLENGE,
      code_challenge_method: 'S256',
    });
    expect(target?.search).toMatchObject({
      code_challenge: CHALLENGE,
      code_challenge_method: 'S256',
    });
  });

  it('carries an app scheme callback to consent, which decides on it', () => {
    const target = grantReturnTarget('myapp', {
      redirect_uri: 'myapp://cb',
      response_type: 'code',
      scope: 'posting',
      code_challenge: CHALLENGE,
      code_challenge_method: 'S256',
    });
    expect(target).toEqual({
      to: '/login',
      search: {
        client_id: 'myapp',
        redirect_uri: 'myapp://cb',
        scope: 'posting',
        response_type: 'code',
        code_challenge: CHALLENGE,
        code_challenge_method: 'S256',
      },
    });
    expect(
      grantReturnTarget('myapp', { redirect_uri: 'javascript:alert(1)' }),
    ).toBeNull();
    // Nothing is granted on the way to a consent that would refuse the app
    // scheme: it needs a code request with a usable S256 challenge.
    for (const over of [
      { code_challenge: undefined },
      { code_challenge_method: 'plain' },
      { response_type: 'token' },
    ])
      expect(
        grantReturnTarget('myapp', {
          redirect_uri: 'myapp://cb',
          response_type: 'code',
          code_challenge: CHALLENGE,
          code_challenge_method: 'S256',
          ...over,
        }),
        JSON.stringify(over),
      ).toBeNull();
  });

  it('does not invent a challenge the request did not have', () => {
    const target = grantReturnTarget('myapp', {
      redirect_uri: 'https://myapp.example/cb',
    });
    expect(target?.search).not.toHaveProperty('code_challenge');
  });
});

it('the RFC 7636 test vector pair is what the docs use', async () => {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(VERIFIER),
  );
  const b64url = btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  expect(b64url).toBe(CHALLENGE);
});
