import * as Sentry from '@sentry/browser';

/**
 * Integration signals: the decisions where this app REFUSES something a
 * third-party app or a link asked for. Each is a handled path that ends in an
 * error on screen, so Sentry would never hear of it, and the one person who
 * could act on it (whoever runs the app) never learns which app is broken.
 *
 * Reported as warnings with a fixed fingerprint per kind and app, so Sentry
 * shows one issue per broken integration with a count, not a flood. The tags
 * carry PUBLIC facts only: the app's account name (public on chain), the
 * callback's host (the app's own domain), an operation name, a field name.
 * Never the callback URL, a token, a memo, a username or any query value.
 */
export type IntegrationIssue =
  | 'redirect_not_registered' // callback not in the app's registered list
  | 'callback_insecure' // registered, but plain http off loopback
  | 'consent_incomplete' // no client_id or no redirect_uri
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

const SAFE = /[^a-z0-9._:-]/gi;

/** Keep tag values short and to a plain character set; they are indexed. */
function tag(value: string | undefined): string | undefined {
  if (!value) return undefined;
  return value.replace(SAFE, '').slice(0, 64) || undefined;
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
  const clean: Record<string, string> = { kind };
  for (const [k, v] of Object.entries(tags)) {
    const t = tag(v);
    if (t) clean[k] = t;
  }
  try {
    Sentry.captureMessage(`integration: ${kind}`, {
      level: 'warning',
      tags: clean,
      // One issue per kind and app (or per kind and op for sign links), so
      // "ecency.app has 340 unregistered-callback rejections" is one row.
      fingerprint: [
        'integration',
        kind,
        clean.app ?? clean.op ?? clean.path ?? '-',
      ],
    });
  } catch {
    // Reporting must never break the flow it reports on.
  }
}
