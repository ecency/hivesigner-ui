import { beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({ captureMessage: vi.fn() }));
vi.mock('@sentry/browser', () => ({ captureMessage: h.captureMessage }));

import { hostOf, reportIntegrationIssue } from './integration-signal';

beforeEach(() => h.captureMessage.mockReset());

describe('reportIntegrationIssue', () => {
  it('reports a warning with public tags and one fingerprint per kind and app', () => {
    reportIntegrationIssue('redirect_not_registered', {
      app: 'ecency.app',
      callback_host: 'ecency.com',
    });
    expect(h.captureMessage).toHaveBeenCalledTimes(1);
    const [message, opts] = h.captureMessage.mock.calls[0];
    expect(message).toBe('integration: redirect_not_registered');
    expect(opts.level).toBe('warning');
    expect(opts.tags).toEqual({
      kind: 'redirect_not_registered',
      app: 'ecency.app',
      callback_host: 'ecency.com',
    });
    expect(opts.fingerprint).toEqual([
      'integration',
      'redirect_not_registered',
      'ecency.app',
    ]);
  });

  it('admits only public, bounded shapes into tags: no link value survives', () => {
    reportIntegrationIssue('sign_request_invalid', {
      op: 'vote?author=alice&permlink=<script>',
      reason: 'invalid_field:weight',
    });
    let [, opts] = h.captureMessage.mock.calls[0];
    // Not a known operation: categorised, not filtered into shape.
    expect(opts.tags.op).toBe('unknown');
    expect(opts.tags.reason).toBe('invalid_field:weight');
    expect(JSON.stringify(opts)).not.toContain('alice');

    h.captureMessage.mockClear();
    reportIntegrationIssue('app_not_found', {
      app: 'sk_live_SECRETVALUE12345',
    });
    [, opts] = h.captureMessage.mock.calls[0];
    // Not an account name shape: dropped entirely, and the fingerprint falls
    // back to the kind alone.
    expect(opts.tags).toEqual({ kind: 'app_not_found' });
    expect(opts.fingerprint).toEqual(['integration', 'app_not_found', '-']);

    h.captureMessage.mockClear();
    reportIntegrationIssue('route_not_found', {
      path: 'SECRET-looking-segment',
    });
    [, opts] = h.captureMessage.mock.calls[0];
    expect(opts.tags.path).toBe('other');
    h.captureMessage.mockClear();
    reportIntegrationIssue('route_not_found', { path: 'login-request' });
    expect(h.captureMessage.mock.calls[0][1].tags.path).toBe('login-request');
  });

  it('names an unknown operation only from the protocol vocabulary, never from the link', () => {
    reportIntegrationIssue('sign_request_invalid', {
      op: 'feedPublish',
      reason: 'unknown_operation',
    });
    expect(h.captureMessage.mock.calls[0][1].tags).toMatchObject({
      op: 'unknown',
      op_name: 'feed_publish',
    });
    // Anything else a link puts in the path is untrusted text: a passphrase,
    // a letters-only token, a key, a prototype name. None of it may reach
    // the call in any form.
    for (const secret of [
      'correct-horse-battery-staple',
      'AbCdEfGhIjKlMnOpQrStUvWxYz',
      '5KT3LKgkovUYzQVSX3WpEGZ4rdazyotpi6piwvdFMxx9eiv8gRL',
      'constructor',
      'transfer_to_savings_next',
    ]) {
      h.captureMessage.mockReset();
      reportIntegrationIssue('sign_request_invalid', {
        op: secret,
        reason: 'unknown_operation',
      });
      const call = h.captureMessage.mock.calls[0];
      expect(call[1].tags, secret).toMatchObject({
        op: 'unknown',
        op_name: 'other',
      });
      const json = JSON.stringify(call).toLowerCase();
      expect(json, secret).not.toContain(secret.toLowerCase());
      expect(json, secret).not.toContain(
        secret.toLowerCase().replace(/-/g, '_'),
      );
    }
  });

  it('tags a legacy spelling of a known operation with the table name', () => {
    reportIntegrationIssue('sign_request_invalid', {
      op: 'transferToVesting',
      reason: 'invalid_field:amount',
    });
    const tags = h.captureMessage.mock.calls[0][1].tags;
    expect(tags.op).toBe('transfer_to_vesting');
    expect(tags.op_name).toBeUndefined();
  });

  it('fingerprints an insecure or invalid callback by its host, so sites do not merge', () => {
    reportIntegrationIssue('callback_insecure', { callback_host: 'A.example' });
    const [, opts] = h.captureMessage.mock.calls[0];
    expect(opts.tags.callback_host).toBe('a.example');
    expect(opts.fingerprint).toEqual([
      'integration',
      'callback_insecure',
      'a.example',
    ]);
  });

  it('reduces a callback to its host', () => {
    expect(hostOf('https://ecency.com/auth?code=SECRET')).toBe('ecency.com');
    expect(hostOf('not a url')).toBeUndefined();
    expect(hostOf(undefined)).toBeUndefined();
  });

  it('survives a reporter that throws', () => {
    // Once, not persistently: vitest 4 surfaces a persistent throwing
    // implementation as a test error even when the caller catches it.
    h.captureMessage.mockImplementationOnce(() => {
      throw new Error('offline');
    });
    let escaped: unknown = null;
    try {
      reportIntegrationIssue('route_not_found', { path: 'x' });
    } catch (e) {
      escaped = e;
    }
    expect(escaped).toBeNull();
    expect(h.captureMessage).toHaveBeenCalledTimes(1);
  });
});
