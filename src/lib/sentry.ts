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
import { isKnownOperation, normalizeOperationName } from './operations';

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

// Field names whose VALUE is sensitive whatever it looks like. Sentry serializes
// a non-Error throw into extra.__serialized__, so `throw { password: 'hunter2' }`
// arrives as a plain field: the value matches no credential pattern and would
// otherwise pass straight through. Over-redacting here is the right trade in a
// signer, even though it costs an error `code` now and then.
const SECRET_NAMES =
  'pass|password|passcode|secret|wif|mnemonic|seed|privatekey|private_key|token|access_token|refresh_token|id_token|code|auth|authorization|signature|sig|payload|memo|key|keys';
const SECRET_KEYS = new RegExp(`^(${SECRET_NAMES})$`, 'i');
/** `name=value` / `name: value` in free text, for EVERY name above, with an
 * optional `Bearer` between. The same vocabulary as SECRET_KEYS, so a field
 * a serialized object would redact is also redacted when it appears as text. */
const NAMED_VALUE_IN_TEXT = new RegExp(
  `\\b(${SECRET_NAMES})\\b\\s*[=:]\\s*(?:bearer\\s+)?[^\\s&"'}]+`,
  'gi',
);

// Credential SHAPES to redact wherever they appear in free text, for values that
// arrive without a telling field name.
const SECRET_PATTERNS: RegExp[] = [
  /\b[5KL][1-9A-HJ-NP-Za-km-z]{50,51}\b/g, // WIF private key
  /\bSTM[1-9A-HJ-NP-Za-km-z]{30,}\b/g, // Hive public key
  /\b(access_token|code|refresh_token|token|password|passcode|secret|wif|key)\b\s*[=:]\s*[^\s&"'}]+/gi,
  /\/sign\/(op|ops|tx)\/[A-Za-z0-9_\-.]+/g, // encoded operation payload
];

// A URL appearing inside free text: absolute, or a rooted path carrying a query.
// Stack frame filenames, culprit, transaction and breadcrumb data all hold these.
const URL_IN_TEXT =
  /(?:[a-z][a-z0-9+.-]*:\/\/[^\s"'<>\\]+|\/[^\s"'<>\\?#]*\?[^\s"'<>\\]*)/gi;

/**
 * Redact credential-shaped values but KEEP the URL and its query. For a report
 * the user chose to send: the link is the point of it, but a token, a code or
 * a key inside it is not theirs to leak, so those are still blanked.
 */
export function redactSecrets(value: string, depth = 0): string {
  let out = value;
  // 1. Query pairs, by DECODED name: `access%5Ftoken=`, `Access_Token=` and
  //    `access_token=` are the same field. The value is replaced in place, so
  //    the rest of the link keeps its exact serialization. A value that is
  //    itself a link (a nested redirect_uri) is decoded, redacted the same
  //    way, and re-encoded, so a secret two levels down is blanked too.
  out = out.replace(
    // A key never contains `?` or `/`: without excluding them the pattern
    // read `/login?access%5Ftoken` as one key and missed the secret.
    /([?&#;]|^)([^=&#;?/\s"'<>]+)=([^&#;\s"'<>]*)/g,
    (whole, sep: string, key: string, val: string) => {
      if (SECRET_KEYS.test(safeDecode(key))) return `${sep}${key}=${REDACTED}`;
      if (depth < 3 && /%(3F|26|3D|2F)/i.test(val)) {
        const decoded = safeDecode(val);
        const redacted = redactSecrets(decoded, depth + 1);
        if (redacted !== decoded)
          return `${sep}${key}=${encodeURIComponent(redacted)}`;
      }
      return whole;
    },
  );
  // 2. Credential SHAPES anywhere.
  for (const pattern of SECRET_PATTERNS) {
    out = out.replace(pattern, (match) => {
      const named = /^([A-Za-z_]+)\s*[=:]/.exec(match);
      return named ? `${named[1]}=${REDACTED}` : REDACTED;
    });
  }
  // 3. Any named secret in free text, whichever name from the shared list.
  out = out.replace(
    NAMED_VALUE_IN_TEXT,
    (_m, name: string) => `${name}=${REDACTED}`,
  );
  return out;
}

function safeDecode(s: string): string {
  try {
    return decodeURIComponent(s.replace(/\+/g, ' '));
  } catch {
    return s;
  }
}

/** Redact credential-shaped substrings from any string we might send. */
export function scrubText(value: string): string {
  // Strip every URL's query and fragment FIRST: the credential is usually the
  // query itself, and enumerating URL-bearing fields missed stack frames.
  let out = value.replace(URL_IN_TEXT, (match) => stripUrl(match));
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
    // The field name alone is enough to redact: see SECRET_KEYS.
    out[k] = SECRET_KEYS.test(k) ? REDACTED : scrubDeep(v, depth + 1, seen);
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

// --- coarse client context -----------------------------------------------------
//
// The HttpContext integration is off (it sends the page URL wholesale), and
// with it went the user agent, so the crash stream showed no browser, no OS
// and no route: two error-boundary crashes on cutover day were undiagnosable.
// What goes back is deliberately coarse and drawn from bounded vocabularies:
// the route FAMILY (never the path), the user agent (not a secret, and Sentry
// derives browser/OS from it), whether the page is being machine-translated
// (the classic cause of insertBefore/removeChild NotFoundError in React), and
// whether the page runs inside an app's web view.

const ROUTE_FAMILIES = new Set([
  'about',
  'accounts',
  'apps',
  'authorize',
  'authorized-apps',
  'auths',
  'developers',
  'import',
  'login',
  'login-request',
  'oauth2',
  'profile',
  'revoke',
  'settings',
  'sign',
  'signmessage',
  'signs',
  'verifymessage',
]);

/** First path segment when it names a route of ours; `home`; else `other`. */
export function routeFamily(pathname: string): string {
  const seg = (pathname.split('/').find(Boolean) ?? '').toLowerCase();
  if (!seg) return 'home';
  return ROUTE_FAMILIES.has(seg) ? seg : 'other';
}

/**
 * The operation a /sign/<op> path is for, in the table's spelling, when it
 * is one we know; `op`, `ops` or `tx` for the encoded forms (whose operation
 * is inside the payload, which never leaves the browser); else `unknown`.
 */
export function signOperation(pathname: string): string | undefined {
  const [first, second] = pathname.split('/').filter(Boolean);
  if (first !== 'sign' || !second) return undefined;
  if (second === 'op' || second === 'ops' || second === 'tx') return second;
  let raw = second;
  try {
    raw = decodeURIComponent(second);
  } catch {
    return 'unknown';
  }
  const name = normalizeOperationName(raw);
  return isKnownOperation(name) ? name : 'unknown';
}

/** Whether the document has been machine-translated in place, and by what. */
export function translatedBy(
  doc: Document,
): 'chrome' | 'edge' | 'widget' | 'no' {
  const root = doc.documentElement;
  if (
    root.classList.contains('translated-ltr') ||
    root.classList.contains('translated-rtl')
  )
    return 'chrome';
  if (doc.querySelector('[_msttexthash], [_msthash]')) return 'edge';
  if (doc.querySelector('font[class^="goog"], #goog-gt-tt')) return 'widget';
  return 'no';
}

/** Whether the user agent is an app's embedded web view rather than a browser. */
export function webviewKind(
  userAgent: string,
): 'android' | 'ios' | 'app' | 'no' {
  if (/\bwv\b/.test(userAgent)) return 'android';
  if (
    /FBAN|FBAV|Instagram|Line\/|Twitter|MicroMessenger|Snapchat|TikTok|BytedanceWebview/i.test(
      userAgent,
    )
  )
    return 'app';
  if (
    /iPhone|iPad|iPod/.test(userAgent) &&
    !/Safari\//.test(userAgent) &&
    !/CriOS|FxiOS|EdgiOS|OPiOS/.test(userAgent)
  )
    return 'ios';
  return 'no';
}

export interface ClientFacts {
  pathname: string;
  userAgent: string;
  translated: ReturnType<typeof translatedBy>;
  lang: string;
}

/** Read the facts off the live page. Never throws; a throw here would drop the event. */
export function clientFacts(): ClientFacts {
  let translated: ClientFacts['translated'] = 'no';
  let lang = '';
  try {
    translated = translatedBy(document);
    lang = document.documentElement.lang;
  } catch {
    // no document, or a hostile one: report without these
  }
  return {
    pathname: window.location.pathname,
    userAgent: navigator.userAgent,
    translated,
    lang,
  };
}

/**
 * Add the coarse context to an event. Runs AFTER sanitizeEvent so nothing it
 * adds is scrubbed away, and adds nothing derived from the query or fragment.
 */
export function attachClientContext(
  event: SentryEvent,
  facts: ClientFacts,
): SentryEvent {
  const tags: Record<string, string> = {
    ...(event.tags as Record<string, string> | undefined),
    route: routeFamily(facts.pathname),
    translated: facts.translated,
    webview: webviewKind(facts.userAgent),
  };
  const op = signOperation(facts.pathname);
  if (op) tags.sign_op = op;
  const lang = facts.lang.replace(/[^a-zA-Z-]/g, '').slice(0, 12);
  if (lang) tags.page_lang = lang;
  event.tags = tags;
  // Only the user agent: Sentry turns it into the browser and OS contexts.
  // No url, no referrer, no query string; those are the fields that leak.
  event.request = {
    headers: { 'User-Agent': facts.userAgent.slice(0, 512) },
  };
  return event;
}

/**
 * The Sentry environment for a hostname. Without it the SDK reports everything
 * as "production", so staging and testnet errors would land in the production
 * issue stream.
 */
export function environmentFor(hostname: string): string {
  const h = hostname.toLowerCase();
  if (h === 'hivesigner.com' || h === 'www.hivesigner.com') return 'production';
  if (h.startsWith('staging.')) return 'staging';
  if (h.startsWith('testnet.')) return 'testnet';
  if (h === 'localhost' || h === '127.0.0.1' || h === '[::1]')
    return 'development';
  return 'other';
}

export function initErrorReporting(): void {
  const dsn = typeof __SENTRY_DSN__ === 'string' ? __SENTRY_DSN__ : '';
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: environmentFor(window.location.hostname),
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
        return attachClientContext(sanitizeEvent(event), clientFacts());
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

export interface UserReport {
  /** What failed, in the same vocabulary as the integration signals. */
  kind: string;
  /** The machine reason, if the app has one (a field name, an op name). */
  reason?: string;
  /** Free text the user typed. */
  note?: string;
  /** Public facts to index on: app account, operation name. */
  tags?: Record<string, string | undefined>;
  /** An error event this report is about, when there is one. */
  associatedEventId?: string;
}

/**
 * A report the USER sends from an error screen: the link they opened, with
 * secret-shaped values blanked, plus whatever they typed. It goes as Sentry
 * feedback, which the automatic scrubbing does not touch: the whole point is
 * that the link survives so someone can reproduce it.
 *
 * Returns the event id for the confirmation, or null when reporting is off.
 */
export function sendUserReport(report: UserReport): string | null {
  if (!Sentry.getClient()) return null;
  const link = redactSecrets(window.location.pathname + window.location.search);
  const lines = [
    `kind: ${report.kind}`,
    report.reason ? `reason: ${report.reason}` : '',
    `link: ${link}`,
    report.note?.trim()
      ? `note: ${redactSecrets(report.note.trim().slice(0, 2000))}`
      : '',
  ].filter(Boolean);
  // `report.tags` come through trustedTags() at the call site: public facts
  // in bounded vocabularies, nothing lifted from a link.
  const tags: Record<string, string> = { report: 'user', kind: report.kind };
  for (const [k, v] of Object.entries(report.tags ?? {})) {
    if (v) tags[k] = v.replace(/[^a-z0-9._:-]/gi, '').slice(0, 64);
  }
  try {
    return Sentry.captureFeedback(
      {
        message: lines.join('\n'),
        associatedEventId: report.associatedEventId,
      },
      { captureContext: { tags } },
    );
  } catch {
    return null;
  }
}
