import * as Sentry from '@sentry/browser';
import { isKnownOperation, normalizeOperationName } from './operations';

/**
 * Integration signals: the decisions where this app REFUSES something a
 * third-party app or a link asked for. Each is a handled path that ends in an
 * error on screen, so Sentry would never hear of it, and the one person who
 * could act on it (whoever runs the app) never learns which app is broken.
 *
 * Reported as warnings with a fixed fingerprint per kind and integration, so
 * Sentry shows one issue per broken integration with a count, not a flood.
 *
 * TAGS ARE TRUSTED DIMENSIONS, NOT LINK VALUES. Everything here starts life in
 * a URL an attacker can write, and a tag is indexed and searchable, so each
 * dimension is admitted only when it has a public, bounded shape: an app is a
 * Hive account NAME (16 lowercase characters at most, so no credential fits),
 * a callback host is a hostname, an operation is one of the 34 known names or
 * `unknown`, a path is one of a short allowlist or `other`, a reason is one of
 * the parser's fixed words. Anything else is dropped, never filtered into
 * shape. That is also what keeps the number of distinct issues bounded.
 */
export type IntegrationIssue =
  | 'redirect_not_registered' // callback not in the app's registered list
  | 'callback_insecure' // a no-app site's callback is plain http off loopback
  | 'callback_invalid' // a no-app site's callback is not a URL, or not http(s)
  | 'consent_incomplete' // no redirect_uri
  | 'app_not_found' // client_id names no Hive account
  | 'sign_request_invalid' // a /sign link this app could not parse
  | 'route_not_found'; // a path nothing serves

export interface IntegrationTags {
  app?: string;
  callback_host?: string;
  op?: string;
  reason?: string;
  path?: string;
}

const ACCOUNT = /^[a-z][a-z0-9.-]{2,15}$/;
// Normalised names carry underscores only (dashes and camelCase are folded).
const OP_WORD = /^[a-z][a-z_]{2,39}$/;
const HOST = /^[a-z0-9.-]{1,253}(:\d{1,5})?$/i;
const REASON =
  /^(unknown_operation|undecodable|extensions_present|invalid_field:[a-z_]{1,40}|invalid|none)$/;
/** Route words worth telling apart when nothing serves them. */
const PATHS = new Set([
  'login',
  'login-request',
  'oauth',
  'oauth2',
  'auth',
  'callback',
  'sign',
  'signs',
  'authorize',
  'revoke',
  'apps',
  'api',
  'docs',
  'import',
  'accounts',
]);

/** The dimensions Sentry may see, each admitted only in its public shape. */
export function trustedTags(
  tags: IntegrationTags = {},
): Record<string, string> {
  const out: Record<string, string> = {};
  if (tags.app && ACCOUNT.test(tags.app)) out.app = tags.app;
  if (tags.callback_host && HOST.test(tags.callback_host))
    out.callback_host = tags.callback_host.toLowerCase();
  if (tags.op !== undefined) {
    // The parser accepts legacy camelCase and kebab-case spellings, so the
    // tag uses the table's name too: a field error on /sign/transferToVesting
    // is a transfer_to_vesting problem, not an unknown operation.
    const name = normalizeOperationName(tags.op);
    if (isKnownOperation(name)) {
      out.op = name;
    } else {
      out.op = 'unknown';
      // WHICH unknown name, so the app producing the link can be found. Only
      // a word shaped like an operation name is admitted: letters and
      // underscores. A token or key pasted into the path carries digits and
      // becomes `other`, so nothing secret-shaped can ride along.
      out.op_name = OP_WORD.test(name) ? name : 'other';
    }
  }
  if (tags.reason && REASON.test(tags.reason)) out.reason = tags.reason;
  if (tags.path !== undefined)
    out.path = PATHS.has(tags.path.toLowerCase())
      ? tags.path.toLowerCase()
      : 'other';
  return out;
}

/** The host of a URL, or nothing: never the URL itself. */
export function hostOf(url: string | undefined): string | undefined {
  if (!url) return undefined;
  try {
    return new URL(url).host;
  } catch {
    return undefined;
  }
}

export function reportIntegrationIssue(
  kind: IntegrationIssue,
  tags: IntegrationTags = {},
): void {
  const clean: Record<string, string> = { kind, ...trustedTags(tags) };
  try {
    Sentry.captureMessage(`integration: ${kind}`, {
      level: 'warning',
      tags: clean,
      // One issue per kind and integration: the app, or the site's host, or
      // the operation, or the route word. All bounded vocabularies.
      fingerprint: [
        'integration',
        kind,
        clean.app ?? clean.callback_host ?? clean.op ?? clean.path ?? '-',
      ],
    });
  } catch {
    // Reporting must never break the flow it reports on.
  }
}
