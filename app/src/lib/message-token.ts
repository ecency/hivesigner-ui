// The Hivesigner "signed message" token, shared by message signing
// (/signmessage) and OAuth login/authorize token issuance.
//
// Exactly matches the Nuxt app (store/auth.ts signMessage): the signed digest
// is sha256(JSON.stringify({signed_message, authors, timestamp})) computed
// BEFORE signatures/authority are added, and the token is b64u(JSON) of the
// full object including them. Verified against a dhive-produced token in the
// tests. Key order in the base object is load-bearing (JSON.stringify preserves
// insertion order), so it is always signed_message, authors, timestamp.
import { PrivateKey, Signature } from '@ecency/sdk/hive';
import { sha256 } from '@noble/hashes/sha2.js';
import { b64uDecode, b64uEncode } from './hive-uri';

export type SignedMessageBody = Record<string, unknown> | string;

export interface SignedMessagePayload {
  signed_message: SignedMessageBody;
  authors: string[];
  timestamp: number;
  signatures: string[];
  authority?: string;
}

/** The digest that is signed: sha256 over the base object, keys in fixed order. */
function messageDigest(
  signed_message: SignedMessageBody,
  authors: string[],
  timestamp: number,
): Uint8Array {
  const base = { signed_message, authors, timestamp };
  return sha256(new TextEncoder().encode(JSON.stringify(base)));
}

/** Build and sign a message payload (the /signmessage flow). */
export function createSignedMessage(
  message: SignedMessageBody,
  username: string,
  wif: string,
  authority?: string,
): SignedMessagePayload {
  const authors = [username];
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = PrivateKey.fromString(wif)
    .sign(messageDigest(message, authors, timestamp))
    .toString();
  return {
    signed_message: message,
    authors,
    timestamp,
    signatures: [signature],
    authority,
  };
}

/** b64u(JSON) of a payload: the verification/access token. */
export function encodeToken(payload: SignedMessagePayload): string {
  return b64uEncode(JSON.stringify(payload));
}

export interface VerifiedToken {
  payload: SignedMessagePayload;
  /** STM address recovered from the first signature. */
  signer: string;
}

/**
 * Decode and structurally validate a token, recovering the signer address.
 * Returns null when the token is malformed or incomplete. Whether the signer is
 * authorized for a given account is a separate check (see verifyMessageToken).
 */
export function decodeToken(token: string): VerifiedToken | null {
  let payload: SignedMessagePayload;
  try {
    payload = JSON.parse(b64uDecode(token));
  } catch {
    return null;
  }
  if (
    !payload ||
    typeof payload !== 'object' ||
    payload.signed_message === undefined ||
    !Array.isArray(payload.authors) ||
    payload.authors.length === 0 ||
    !payload.timestamp ||
    !Array.isArray(payload.signatures) ||
    payload.signatures.length === 0
  ) {
    return null;
  }
  try {
    const digest = messageDigest(
      payload.signed_message,
      payload.authors,
      payload.timestamp,
    );
    const signer = Signature.from(payload.signatures[0])
      .getPublicKey(digest)
      .toString();
    return { payload, signer };
  } catch {
    return null;
  }
}

/** The role whose key_auths (or memo_key) contains `pub`, or null. */
export function matchAuthority(
  account: {
    owner?: { key_auths: [string, number][] };
    active?: { key_auths: [string, number][] };
    posting?: { key_auths: [string, number][] };
    memo_key?: string;
  },
  pub: string,
): 'owner' | 'active' | 'posting' | 'memo' | null {
  for (const role of ['owner', 'active', 'posting'] as const) {
    if (account[role]?.key_auths?.some(([key]) => key === pub)) return role;
  }
  return account.memo_key === pub ? 'memo' : null;
}
