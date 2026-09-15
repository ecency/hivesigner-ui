// Error reporting, deliberately paranoid.
//
// This app is a signer: its URLs carry the credentials themselves. A consent
// redirect is `?access_token=<token that can post as the user for a week>` or
// `?code=<authorization code>`, a sign request is `/sign/op/<base64 of the whole
// operation>`, and private keys live in memory while a session is unlocked.
// Sentry's browser defaults attach the page URL to every event and record
// navigation, fetch and console breadcrumbs, so an out-of-the-box init would
// upload users' credentials to a third party. We have already had `/hs/<token>`
// reach Sentry breadcrumbs in another Ecency app and had to purge the events.
//
// So: every URL is stripped of its query and fragment before it leaves the
// browser, credential-shaped substrings are redacted from text, and the
// integrations that capture user input or console output are turned off.
import * as Sentry from '@sentry/browser';

declare const __SENTRY_DSN__: string;
declare const __BUILD_SHA__: string;

const REDACTED = '[redacted]';

const ABSOLUTE_URL = /^[a-z][a-z0-9+.-]*:\/\//i;

/** Query/fragment carry the credentials, so keep only origin + path. */
export function stripUrl(value: string): string {
  if (!value) return value;
  const absolute = ABSOLUTE_URL.test(value);
  // Only parse what is actually a URL or an absolute path. `new URL` succeeds on
  // arbitrary text by resolving it against the base and percent-encodes it, so
  // parsing everything would mangle ordinary strings into fake paths.
  if (!absolute && !value.startsWith('/')) return value.split(/[?#]/)[0];
  try {
    const url = new URL(value, 'https://placeholder.invalid');
    return absolute ? `${url.origin}${url.pathname}` : url.pathname;
  } catch {
    return value.split(/[?#]/)[0];
  }
}

// Credential shapes to redact wherever they appear in free text: a WIF (base58,
// starts with 5/K/L), a Hive public key, a base64url token or operation blob,
// and the named parameters that carry tokens and passcodes.
const SECRET_PATTERNS: RegExp[] = [
  /\b[5KL][1-9A-HJ-NP-Za-km-z]{50,51}\b/g, // WIF private key
  /\bSTM[1-9A-HJ-NP-Za-km-z]{30,}\b/g, // Hive public key
  /\b(access_token|code|refresh_token|token|password|passcode|secret|wif|key)\b\s*[=:]\s*[^\s&"'}]+/gi,
  /\/sign\/(op|ops|tx)\/[A-Za-z0-9_\-.]+/g, // encoded operation payload
];

/** Redact credential-shaped substrings from any string we might send. */
export function scrubText(value: string): string {
  let out = value;
  for (const pattern of SECRET_PATTERNS) {
    out = out.replace(pattern, (match) => {
      // Keep the parameter name so the report is still readable.
      const named = /^([A-Za-z_]+)\s*[=:]/.exec(match);
      return named ? `${named[1]}=${REDACTED}` : REDACTED;
    });
  }
  return out;
}

/**
 * Walk an event and scrub every string. Depth-limited and cycle-safe: this runs
 * inside beforeSend, where a throw silently DROPS the event.
 */
function scrubDeep(value: unknown, depth = 0, seen = new WeakSet()): unknown {
  if (depth > 8) return REDACTED;
  if (typeof value === 'string') return scrubText(value);
  if (!value || typeof value !== 'object') return value;
  if (seen.has(value as object)) return REDACTED;
  seen.add(value as object);
  if (Array.isArray(value))
    return value.map((v) => scrubDeep(v, depth + 1, seen));
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value)) {
    out[k] = scrubDeep(v, depth + 1, seen);
  }
  return out;
}

type SentryEvent = Parameters<
  NonNullable<Sentry.BrowserOptions['beforeSend']>
>[0];
type SentryBreadcrumb = Parameters<
  NonNullable<Sentry.BrowserOptions['beforeBreadcrumb']>
>[0];

/** Scrub an event in place-ish: URLs truncated, all free text redacted. */
export function sanitizeEvent(event: SentryEvent): SentryEvent {
  const scrubbed = scrubDeep(event) as SentryEvent;
  if (scrubbed.request?.url)
    scrubbed.request.url = stripUrl(scrubbed.request.url);
  // Referrer and the Sentry-added query_string can both carry the token.
  if (scrubbed.request) {
    scrubbed.request.query_string = undefined;
    const headers = scrubbed.request.headers as
      | Record<string, string>
      | undefined;
    if (headers?.Referer) headers.Referer = stripUrl(headers.Referer);
  }
  return scrubbed;
}

/** Drop the noisy/leaky breadcrumb kinds; strip URLs on the rest. */
export function sanitizeBreadcrumb(
  crumb: SentryBreadcrumb,
): SentryBreadcrumb | null {
  // Console output and user input are the two richest sources of accidental
  // secrets, and neither is worth the risk here.
  if (crumb.category === 'console' || crumb.category === 'ui.input')
    return null;
  const scrubbed = scrubDeep(crumb) as SentryBreadcrumb;
  if (typeof scrubbed.data?.url === 'string')
    scrubbed.data.url = stripUrl(scrubbed.data.url);
  if (typeof scrubbed.data?.from === 'string')
    scrubbed.data.from = stripUrl(scrubbed.data.from);
  if (typeof scrubbed.data?.to === 'string')
    scrubbed.data.to = stripUrl(scrubbed.data.to);
  return scrubbed;
}

/**
 * Initialise reporting. A no-op when no DSN is configured, which is the case for
 * local development and any build that does not pass one.
 */
export function initErrorReporting(): void {
  const dsn = typeof __SENTRY_DSN__ === 'string' ? __SENTRY_DSN__ : '';
  if (!dsn) return;

  Sentry.init({
    dsn,
    release: typeof __BUILD_SHA__ === 'string' ? __BUILD_SHA__ : undefined,
    // Never attach IP, cookies or user identifiers.
    sendDefaultPii: false,
    // Errors only. No tracing or replay: a replay of this app is a recording of
    // someone typing their private key.
    tracesSampleRate: 0,
    integrations: (defaults) =>
      defaults.filter(
        (integration) =>
          // Breadcrumbs stay (scrubbed) for context, but drop the integrations
          // that read the DOM, the console or the URL wholesale.
          integration.name !== 'Breadcrumbs' &&
          integration.name !== 'BrowserSession' &&
          integration.name !== 'HttpContext',
      ),
    beforeSend(event) {
      // A throw here DROPS the event silently, so never let one escape.
      try {
        return sanitizeEvent(event);
      } catch {
        return null;
      }
    },
    beforeBreadcrumb(crumb) {
      try {
        return sanitizeBreadcrumb(crumb);
      } catch {
        return null;
      }
    },
  });
}
