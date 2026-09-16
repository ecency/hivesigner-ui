// OAuth2 login/authorize helpers: scope normalization, app-profile lookup and
// redirect_uri validation, token issuance and the callback redirect. The token
// is the shared signed-message token (message-token.ts); this module only shapes
// what is signed and how the browser is redirected, matching the Nuxt app
// (oauth2/authorize.vue + login.vue + store/auth.ts signAndRedirectToCallback).
import { type Account, getAccount } from './hive';
import { isAbsoluteHttpUrl, resolveInternalPath } from './internal-path';
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

/**
 * Normalize the LEGACY /login (and /login-request/<clientId>) query, matching
 * login.vue. It is deliberately not the same as normalizeAuthRequest:
 *
 * - the callback may arrive as `redirect_uri` OR `redirect`;
 * - the client id may arrive as a path segment, `clientId` or `client_id`;
 * - scope accepts ONLY 'login' or 'posting' and anything else falls back to
 *   'login'. /oauth2/authorize falls back to 'posting' instead, so mapping these
 *   onto one normalizer would silently upgrade a malformed legacy request from a
 *   username-only login to a posting grant;
 * - response_type accepts only 'code' or 'token', defaulting to 'token'.
 */
export function normalizeLoginRequest(
  query: Record<string, string>,
  pathClientId?: string,
): AuthRequest {
  const scope = query.scope === 'posting' ? 'posting' : 'login';
  return {
    clientId: pathClientId || query.clientId || query.client_id,
    // `redirect` is only a CALLBACK when it is an absolute http(s) URL. A
    // relative `?redirect=/profile` is the legacy LOCAL login-and-return flow
    // (login.vue pushed straight to it without issuing a token), so treating it
    // as an OAuth callback turned that flow into an invalid-request error.
    // Not decoded: the router's parseSearch already did (see
    // normalizeAuthRequest).
    redirectUri: query.redirect_uri || absoluteRedirect(query.redirect),
    scope,
    responseType: query.response_type === 'code' ? 'code' : 'token',
    state: query.state,
  };
}

function absoluteRedirect(value: string | undefined): string | undefined {
  return isAbsoluteHttpUrl(value) ? value : undefined;
}

/**
 * A legacy /login request whose real parameters are NESTED inside its `redirect`.
 *
 * login.vue built `hive://login-request/<clientId>?<the whole /login query>` and
 * sent the user through the grant detour carrying it as `redirect`, so the client
 * id lives in that URL's PATH and the callback and scope live in its query.
 * Passing the outer query straight to the consent screen produced an AuthRequest
 * with no client id and no callback, so authorization could not complete.
 *
 * Outer params win where both define one: the outer query is the live request and
 * the nested copy is what was captured when the detour was built.
 */
export function unpackLoginRequest(query: Record<string, string>): {
  query: Record<string, string>;
  pathClientId?: string;
} {
  const url = loginRequestUrl(query.redirect);
  if (!url) return { query };
  try {
    const segments = url.pathname.split('/').filter(Boolean);
    const pathClientId = segments[1];
    const nested: Record<string, string> = {};
    url.searchParams.forEach((value, key) => {
      nested[key] = value;
    });
    // Drop the consumed `redirect` so the merged query is judged on its own.
    const { redirect: _consumed, ...outer } = query;
    return { query: { ...nested, ...outer }, pathClientId };
  } catch {
    return { query };
  }
}

/**
 * The nested /login-request URL a `redirect` points at, or null.
 *
 * Matched on the resolved PATHNAME, not with `includes`: a substring test also
 * fired for `?redirect=/profile?ref=/login-request`, which is an ordinary local
 * redirect, and then discarded the user's destination.
 */
function loginRequestUrl(redirect: string | undefined): URL | null {
  if (!redirect) return null;
  try {
    const url = new URL(redirect, window.location.origin);
    if (url.origin !== window.location.origin) return null;
    const segments = url.pathname.split('/').filter(Boolean);
    return segments[0] === 'login-request' ? url : null;
  } catch {
    return null;
  }
}

/**
 * Whether a legacy /login request is the LOCAL login-and-return flow rather than
 * app consent: no client id and no absolute callback. A bare /login is local too
 * (login.vue sent it to '/'), and a `redirect` pointing at /login-request is the
 * OAuth grant detour, not a local path.
 */
export function isLocalLoginRequest(query: Record<string, string>): boolean {
  if (query.client_id || query.clientId) return false;
  if (query.redirect_uri) return false;
  const redirect = query.redirect;
  if (redirect && (isAbsoluteHttpUrl(redirect) || loginRequestUrl(redirect)))
    return false;
  return true;
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
  // Append to the callback's own STRING rather than round-tripping it through
  // URL: searchParams re-serialises the app's existing query (`q=%20x` becomes
  // `q=+x`, a valueless `flag` becomes `flag=`), and an app that byte-compares
  // its own callback would see a different URL than it registered.
  //
  // The params go BEFORE any fragment. A registered callback may end in one
  // (`https://app.example/cb#done`), and appending after it put the whole token
  // inside the fragment, which a browser never sends to the server, so the app
  // received no parameters at all.
  const hash = callback.indexOf('#');
  const base = hash === -1 ? callback : callback.slice(0, hash);
  const fragment = hash === -1 ? '' : callback.slice(hash);
  const separator = base.includes('?') ? '&' : '?';
  return `${base}${separator}${params.toString()}${fragment}`;
}

export type { Account };

/**
 * Where the grant page (/authorize/:app, /revoke/:app) sends the user once the
 * broadcast has landed, when it was reached with a callback.
 *
 * This is the Nuxt app's grant DETOUR, still generated by the production
 * login page and by third-party links: `/authorize/<app>?redirect_uri=...`.
 * authorize/_username.vue handled it in two ways after the broadcast, and both
 * are routed through the consent screen here rather than reimplemented:
 *
 *  - a PATH callback (`/login-request/ecency.app?...`, the common case) went to
 *    `/login?redirect=<callback>`. /login unpacks a nested login-request and
 *    renders the consent screen, which issues the token and returns the user to
 *    the app. Any other internal path is the local login-and-return flow.
 *  - an ABSOLUTE callback was signed and redirected to directly, with the app,
 *    scope and response_type from the query. That becomes a consent request
 *    for THIS app, so the callback is checked against the app's registered
 *    redirect_uris, which the Nuxt page never did.
 *
 * Anything else (no callback, an off-site path, a non-http scheme) yields null
 * and the page falls back to the account list, as before this existed. The
 * rewrite dropped the callback entirely: a user sent through the detour
 * granted authority and then landed on their account list, and the login
 * they started was simply lost.
 */
export function grantReturnTarget(
  appName: string,
  query: Record<string, string | undefined>,
): { to: '/login'; search: Record<string, string> } | null {
  const callback = query.redirect_uri || query.redirect;
  if (!callback) return null;
  if (isAbsoluteHttpUrl(callback)) {
    const search: Record<string, string> = {
      client_id: appName,
      redirect_uri: callback,
      scope: query.scope === 'posting' ? 'posting' : 'login',
      response_type: query.response_type === 'code' ? 'code' : 'token',
    };
    if (query.state) search.state = query.state;
    return { to: '/login', search };
  }
  if (!resolveInternalPath(callback)) return null;
  return { to: '/login', search: { redirect: callback } };
}
