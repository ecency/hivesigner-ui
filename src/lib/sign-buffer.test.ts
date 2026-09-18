import { PrivateKey, Signature } from '@ecency/sdk/hive';
import { sha256 } from '@noble/hashes/sha2.js';
import { describe, expect, it } from 'vitest';
import {
  isTokenBody,
  parseSignBufferRequest,
  signBuffer,
  signBufferRedirect,
  visibleMessage,
} from './sign-buffer';

// A throwaway key pair, not an account on chain.
const WIF = '5KT3LKgkovUYzQVSX3WpEGZ4rdazyotpi6piwvdFMxx9eiv8gRL';
const PUB = 'STM4tb8Quiasc1qFoxqAkA72zug5bTUbZxAFBzDV43LXoBBRZdXkS';

/** The key a signature recovers to over sha256 of the message's UTF-8
    bytes, computed apart from the code under test (Node's Buffer). */
const recovered = (signature: string, message: string) =>
  Signature.from(signature)
    .getPublicKey(sha256(new Uint8Array(Buffer.from(message, 'utf8'))))
    .toString();

describe('parseSignBufferRequest', () => {
  it('signs with the posting key unless active is asked for, in any case', () => {
    expect(parseSignBufferRequest({ message: 'm' }).authority).toBe('posting');
    expect(
      parseSignBufferRequest({ message: 'm', authority: 'Active' }).authority,
    ).toBe('active');
  });

  it('names no key for owner, memo or anything else', () => {
    for (const authority of ['owner', 'memo', 'posting ', ''])
      expect(
        parseSignBufferRequest({ message: 'm', authority }).authority,
      ).toBeNull();
  });

  it('reads client_id or clientId, the callback and the state', () => {
    expect(
      parseSignBufferRequest({
        message: 'm',
        clientId: 'app',
        redirect_uri: 'https://a.example/cb',
        state: 's',
      }),
    ).toEqual({
      message: 'm',
      authority: 'posting',
      clientId: 'app',
      redirectUri: 'https://a.example/cb',
      state: 's',
    });
  });
});

describe('isTokenBody', () => {
  it('finds a Hivesigner token body, as its signature covers it', () => {
    const body = JSON.stringify({
      signed_message: { type: 'code', app: 'ecency.app' },
      authors: ['alice'],
      timestamp: 1726650000,
    });
    expect(isTokenBody(body)).toBe(true);
    expect(isTokenBody(` ${body}\n`)).toBe(true);
    expect(isTokenBody('{"signed_message":null}')).toBe(true);
  });

  it('leaves text and other JSON alone', () => {
    for (const message of [
      'I am alice',
      'signed_message',
      '{"message":"hi"}',
      '["signed_message"]',
      '"{\\"signed_message\\":1}"',
      '42',
      '{"__proto__":{"signed_message":1}}',
      '{not json',
    ])
      expect(isTokenBody(message)).toBe(false);
  });
});

describe('signBuffer', () => {
  it("is Keychain's signature: sha256 over the UTF-8 message, by the key", () => {
    for (const message of [
      'Login to example.com at 12:00',
      'Привет 👋 مرحبا',
    ]) {
      const { signature, publicKey } = signBuffer(message, WIF);
      expect(publicKey).toBe(PUB);
      expect(recovered(signature, message)).toBe(PUB);
    }
  });

  it('covers every character of the message', () => {
    const { signature } = signBuffer('pay 10', WIF);
    expect(recovered(signature, 'pay 100')).not.toBe(PUB);
  });

  it('answers with the public key of the key it signed with', () => {
    const other = PrivateKey.fromSeed('another test seed');
    expect(signBuffer('m', other.toString()).publicKey).toBe(
      other.createPublic().toString(),
    );
  });
});

describe('visibleMessage', () => {
  it('keeps plain text, line breaks, tabs and emoji as they are', () => {
    expect(visibleMessage('line one\nline\ttwo 👋')).toEqual([
      { text: 'line one\nline\ttwo 👋', escaped: false },
    ]);
  });

  it('shows characters that hide or reorder text as escapes', () => {
    // Built from code points: a formatter would write them out literally.
    const [RLO, NUL, ZWSP, CR] = [0x202e, 0, 0x200b, 0x0d].map((cp) =>
      String.fromCodePoint(cp),
    );
    expect(visibleMessage(`pay ${RLO}gnp.exe${NUL}!`)).toEqual([
      { text: 'pay ', escaped: false },
      { text: '\\u{202E}', escaped: true },
      { text: 'gnp.exe', escaped: false },
      { text: '\\u{0000}', escaped: true },
      { text: '!', escaped: false },
    ]);
    expect(visibleMessage(`a${ZWSP}b${CR}`)).toEqual([
      { text: 'a', escaped: false },
      { text: '\\u{200B}', escaped: true },
      { text: 'b', escaped: false },
      { text: '\\u{000D}', escaped: true },
    ]);
  });
});

describe('signBufferRedirect', () => {
  const answer = {
    signature: 'sig',
    publicKey: PUB,
    username: 'alice',
    authority: 'posting' as const,
  };

  it("adds the answer to the callback, keeping the app's own query and fragment", () => {
    expect(
      signBufferRedirect('https://a.example/cb?q=%20x#done', {
        ...answer,
        state: 's 1',
      }),
    ).toBe(
      `https://a.example/cb?q=%20x&signature=sig&public_key=${PUB}&username=alice&authority=posting&state=s+1#done`,
    );
  });

  it('adds no state when the request had none', () => {
    expect(signBufferRedirect('https://a.example/cb', answer)).toBe(
      `https://a.example/cb?signature=sig&public_key=${PUB}&username=alice&authority=posting`,
    );
  });
});
