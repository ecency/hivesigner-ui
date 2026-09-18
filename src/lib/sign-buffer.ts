// An app asks for a message signed with one of the account's keys (#84), the
// way Hive Keychain's requestSignBuffer does, and gets the signature back on
// its callback. The signature is Keychain's: sha256 over the message's UTF-8
// bytes, signed with the key, so an app verifies it with the code it already
// has for Keychain.
import { PrivateKey } from '@ecency/sdk/hive';
import { sha256 } from '@noble/hashes/sha2.js';
import { appendToCallback } from './oauth';
import { isUnsafeDisplayChar } from './operation-summary';

export type BufferAuthority = 'posting' | 'active';

export interface SignBufferRequest {
  message: string;
  /** null: the request named a key this cannot sign with. */
  authority: BufferAuthority | null;
  clientId?: string;
  redirectUri?: string;
  state?: string;
}

/** The /sign-buffer query. `authority` defaults to posting and, as Keychain
    spells it, is read in any case ("Posting"). Owner is never used. */
export function parseSignBufferRequest(
  query: Record<string, string>,
): SignBufferRequest {
  const named = (query.authority ?? 'posting').toLowerCase();
  return {
    message: query.message ?? '',
    authority: named === 'posting' || named === 'active' ? named : null,
    clientId: query.client_id || query.clientId,
    redirectUri: query.redirect_uri,
    state: query.state,
  };
}

/**
 * Whether the message is a Hivesigner token body: a JSON object with a
 * `signed_message`. A token's signature is exactly this signature over its
 * JSON, and Hivesigner's API and the apps that take its tokens accept one
 * signed by any of the account's keys. Signing one would hand the requester
 * a token for the account (an app's code or access token), so it is never
 * signed, whatever else the message says.
 */
export function isTokenBody(message: string): boolean {
  let parsed: unknown;
  try {
    parsed = JSON.parse(message);
  } catch {
    return false;
  }
  return (
    typeof parsed === 'object' &&
    parsed !== null &&
    !Array.isArray(parsed) &&
    Object.hasOwn(parsed, 'signed_message')
  );
}

/** Keychain's signature over `message`, and the public key it recovers to. */
export function signBuffer(
  message: string,
  wif: string,
): { signature: string; publicKey: string } {
  const key = PrivateKey.fromString(wif);
  return {
    signature: key.sign(sha256(new TextEncoder().encode(message))).toString(),
    publicKey: key.createPublic().toString(),
  };
}

/**
 * The message in parts to show, exactly as it will be signed. Characters
 * that would hide or reorder text on screen (controls, zero-width and bidi
 * marks) are shown as escapes: stripping them would show a message other
 * than the one signed. Line breaks and tabs stay as they are.
 */
export function visibleMessage(
  message: string,
): { text: string; escaped: boolean }[] {
  const parts: { text: string; escaped: boolean }[] = [];
  for (const ch of message) {
    const cp = ch.codePointAt(0) ?? 0;
    const escaped = cp !== 0x0a && cp !== 0x09 && isUnsafeDisplayChar(cp);
    const text = escaped
      ? `\\u{${cp.toString(16).toUpperCase().padStart(4, '0')}}`
      : ch;
    const last = parts.at(-1);
    if (last && !last.escaped && !escaped) last.text += text;
    else parts.push({ text, escaped });
  }
  return parts;
}

/** The callback with the signature added (and the request's state). */
export function signBufferRedirect(
  callback: string,
  answer: {
    signature: string;
    publicKey: string;
    username: string;
    authority: BufferAuthority;
    state?: string;
  },
): string {
  const params = new URLSearchParams();
  params.set('signature', answer.signature);
  params.set('public_key', answer.publicKey);
  params.set('username', answer.username);
  params.set('authority', answer.authority);
  if (answer.state) params.set('state', answer.state);
  return appendToCallback(callback, params);
}
