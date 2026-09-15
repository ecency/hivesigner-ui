// OAuth2 login/authorize helpers: scope normalization, app-profile lookup and
// redirect_uri validation, token issuance and the callback redirect. The token
// is the shared signed-message token (message-token.ts); this module only shapes
// what is signed and how the browser is redirected, matching the Nuxt app
// (oauth2/authorize.vue + login.vue + store/auth.ts signAndRedirectToCallback).
import { type Account, getAccount } from './hive';
import { createSignedMessage, encodeToken } from './message-token';

export type ResponseType = 'code' | 'token';

export interface AuthRequest {
  clientId?: string;
  redirectUri?: string;
  scope: string;
  responseType: ResponseType;
  state?: string;
}

/**
 * Normalize the /oauth2/authorize query, matching oauth2/authorize.vue:
 * scope 'login' stays login; any scope containing 'offline' forces posting +
 * response_type 'code'; anything else becomes posting. response_type otherwise
 * defaults to 'token'.
 */
export function normalizeAuthRequest(
  query: Record<string, string>,
): AuthRequest {
  let scope = 'posting';
  let responseType: ResponseType =
    query.response_type === 'code' ? 'code' : 'token';
  if (query.scope === 'login') scope = 'login';
  if (query.scope?.includes('offline')) {
    scope = 'posting';
    responseType = 'code';
  }
  return {
    clientId: query.client_id || query.clientId,
    // NOT decoded here: the router's parseSearch (lib/search.ts) builds the
    // query with URLSearchParams, which has already percent-decoded every value.
    // Decoding a second time corrupts a legitimate callback that contains an
    // encoded character (a registered `...?next=a%2Bb` would become `a+b` and
    // then fail the exact-match registration check).
    redirectUri: query.redirect_uri,
    scope,
    responseType,
    state: query.state,
  };
}

/** Loopback, where TLS is not available and a plain-http callback is expected. */
function isLoopback(hostname: string): boolean {
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '[::1]' ||
    hostname === '::1'
  );
}

/**
 * A redirect we are willing to put a token in. https only (a `javascript:` or
 * other-scheme redirect is never valid), because buildRedirectUrl puts the
 * signed token in the query string: over plain http that token, which grants
 * posting authority for a week, is readable by anyone on the path. Loopback is
 * exempt so local development against 127.0.0.1 still works.
 */
export function isValidRedirectUri(value: string): boolean {
  try {
    const u = new URL(value);
    if (u.protocol === 'https:') return true;
    return u.protocol === 'http:' && isLoopback(u.hostname);
  } catch {
    return false;
  }
}

export interface AppProfile {
  name: string;
  redirectUris: string[];
}

/** Read an app account's profile (name + registered redirect_uris). */
export async function loadAppProfile(
  clientId: string,
): Promise<AppProfile | null> {
  const account = await getAccount(clientId);
  if (!account) return null;
  try {
    const profile =
      JSON.parse(account.posting_json_metadata || '{}').profile ?? {};
    return {
      // The profile is the app account's own on-chain metadata, so `name` can be
      // any JSON value. Accept it only when it is a string: rendering an object
      // as a React child throws and takes the consent screen down.
      name:
        typeof profile.name === 'string' && profile.name
          ? profile.name
          : clientId,
      redirectUris: Array.isArray(profile.redirect_uris)
        ? profile.redirect_uris.filter((u: unknown) => typeof u === 'string')
        : [],
    };
  } catch {
    return { name: clientId, redirectUris: [] };
  }
}

/**
 * Whether the callback is registered for the app. Exact-match against the app
 * account's redirect_uris, plus a well-formed-URL check, matching login.vue.
 * (The Nuxt app has a known bug where it issues a token even when this fails;
 * the React app enforces it - see the sign/oauth notes.)
 */
export function isRegisteredRedirect(
  profile: AppProfile,
  callback: string,
): boolean {
  return (
    isValidRedirectUri(callback) && profile.redirectUris.includes(callback)
  );
}

/** The role a scope needs: posting scope grants posting authority. */
export function authorityForScope(scope: string): 'posting' | 'active' {
  return scope === 'active' ? 'active' : 'posting';
}

/**
 * Build the login/authorize token. signed_message = { type, app? } where type
 * is 'code' for the code flow, else the scope. Signed with the given key.
 */
export function buildAuthToken(
  req: AuthRequest,
  username: string,
  wif: string,
  authority: string,
): string {
  const type = req.responseType === 'code' ? 'code' : req.scope;
  const message = req.clientId ? { type, app: req.clientId } : { type };
  return encodeToken(createSignedMessage(message, username, wif, authority));
}

/**
 * The callback URL to redirect to after issuing a token. Params are added in the
 * Nuxt app's order (code|access_token+expires_in, then state, then username),
 * but MERGED into the callback's existing query rather than appended after a
 * second '?'. The Nuxt app always concatenated '?', which corrupts a registered
 * callback that already carries a query ('.../cb?tenant=1' became
 * '.../cb?tenant=1?access_token=...', losing tenant to a malformed query).
 */
export function buildRedirectUrl(
  callback: string,
  token: string,
  req: AuthRequest,
  username: string,
): string {
  const params = new URLSearchParams();
  if (req.responseType === 'code') params.set('code', token);
  if (req.state) params.set('state', req.state);
  if (req.responseType !== 'code') {
    params.set('access_token', token);
    params.set('expires_in', '604800');
  }
  params.set('username', username);
  try {
    const url = new URL(callback);
    for (const [key, value] of params) url.searchParams.set(key, value);
    return url.toString();
  } catch {
    // Callbacks reaching here are already validated as URLs; keep a separator
    // that at least does not produce a second '?' if one ever is not.
    return `${callback}${callback.includes('?') ? '&' : '?'}${params.toString()}`;
  }
}

export type { Account };
