// The app's Hive chain layer, built on @ecency/sdk/hive.
//
// The SDK is used in place of dhive and a hand-rolled client: callRPC has
// multi-node failover, health tracking, adaptive timeouts and hedging, and its
// crypto (PrivateKey/PublicKey/Signature) is browser-native (@noble, no Buffer),
// verified against dhive vectors in hive.test.ts. This module is the single
// import point for chain reads, key derivation, credential checks and message
// signing; the rest of the app never imports the SDK directly.
import { callRPC, type KeyRole, PrivateKey, Signature } from '@ecency/sdk/hive';
import { sha256 } from '@noble/hashes/sha2.js';

export type { KeyRole };

// --- reads (with SDK failover) -----------------------------------------------

export interface Authority {
  weight_threshold: number;
  account_auths: [string, number][];
  key_auths: [string, number][];
}

export interface Account {
  name: string;
  memo_key: string;
  owner: Authority;
  active: Authority;
  posting: Authority;
  json_metadata: string;
  posting_json_metadata: string;
}

export function getAccounts(names: string[]): Promise<Account[]> {
  return callRPC('condenser_api.get_accounts', [names]);
}

export async function getAccount(name: string): Promise<Account | null> {
  const [account] = await getAccounts([name]);
  return account ?? null;
}

export interface DynamicGlobalProperties {
  total_vesting_fund_hive: string;
  total_vesting_shares: string;
  head_block_number: number;
  head_block_id: string;
  time: string;
}

export function getDynamicGlobalProperties(): Promise<DynamicGlobalProperties> {
  return callRPC('condenser_api.get_dynamic_global_properties', []);
}

interface Content {
  json_metadata: string;
}

/** The curated top-apps list published on the @hivesigner/top-apps post. */
export async function getTopApps(): Promise<string[]> {
  try {
    const content = (await callRPC('condenser_api.get_content', [
      'hivesigner',
      'top-apps',
    ])) as Content;
    const data = JSON.parse(content.json_metadata || '{}').data;
    return Array.isArray(data)
      ? data.filter((x): x is string => typeof x === 'string')
      : [];
  } catch {
    return [];
  }
}

/** SP-per-VEST, for rendering HP amounts. Falls back to 1 when unavailable. */
export async function getVestsToSp(): Promise<number> {
  try {
    const p = await getDynamicGlobalProperties();
    const sp =
      Number.parseFloat(p.total_vesting_fund_hive) /
      Number.parseFloat(p.total_vesting_shares);
    return Number.isFinite(sp) && sp > 0 ? sp : 1;
  } catch {
    return 1;
  }
}

// --- keys --------------------------------------------------------------------

export type Keys = Partial<Record<KeyRole, string>>;

const ROLES: KeyRole[] = ['owner', 'active', 'posting', 'memo'];

/** The STM public address for a WIF, or null when the WIF is invalid. */
export function publicKeyFromWif(wif: string): string | null {
  try {
    return PrivateKey.fromString(wif).createPublic().toString();
  } catch {
    return null;
  }
}

/** Derive all four keys from a master password (PrivateKey.fromLogin per role). */
export function deriveKeysFromMasterPassword(
  username: string,
  password: string,
): Keys {
  const keys: Keys = {};
  for (const role of ROLES) {
    keys[role] = PrivateKey.fromLogin(username, password, role).toString();
  }
  return keys;
}

/**
 * Which role a private key holds for an account, or null if it belongs to none.
 * owner/active/posting are matched against key_auths; memo against memo_key.
 * This is the login credential check: a key the user pastes is accepted only
 * when its public key is actually on the account on-chain.
 */
export function keyRoleForAccount(
  account: Account,
  wif: string,
): KeyRole | null {
  const pub = publicKeyFromWif(wif);
  if (!pub) return null;
  for (const role of ['owner', 'active', 'posting'] as const) {
    if (account[role]?.key_auths?.some(([key]) => key === pub)) return role;
  }
  if (account.memo_key === pub) return 'memo';
  return null;
}

/**
 * Given a pasted secret (a WIF or a master password) and the on-chain account,
 * return the keys it unlocks keyed by role, or null when it matches nothing.
 * A master password yields all roles it derives that are actually on the account.
 */
export function resolveCredential(
  account: Account,
  secret: string,
): Keys | null {
  // A single WIF.
  const role = keyRoleForAccount(account, secret);
  if (role) return { [role]: secret };

  // A master password: derive, keep only roles whose pubkey is on the account.
  const derived = deriveKeysFromMasterPassword(account.name, secret);
  const kept: Keys = {};
  for (const r of ROLES) {
    const wif = derived[r];
    if (wif && keyRoleForAccount(account, wif) === r) kept[r] = wif;
  }
  return Object.keys(kept).length > 0 ? kept : null;
}

// --- message signing ---------------------------------------------------------

/** sha256 of a UTF-8 string (the digest Hive message signing uses). */
export function sha256Message(message: string): Uint8Array {
  return sha256(new TextEncoder().encode(message));
}

/** Sign a message string with a WIF; returns the 130-char hex signature. */
export function signMessage(message: string, wif: string): string {
  return PrivateKey.fromString(wif).sign(sha256Message(message)).toString();
}

/** Recover the signer's STM address from a message + signature. */
export function recoverMessageSigner(
  message: string,
  signatureHex: string,
): string {
  return Signature.from(signatureHex)
    .getPublicKey(sha256Message(message))
    .toString();
}

/** Whether a signature over a message was produced by one of the account's keys. */
export function verifyMessage(
  message: string,
  signatureHex: string,
  account: Account,
): boolean {
  try {
    const signer = recoverMessageSigner(message, signatureHex);
    for (const role of ['owner', 'active', 'posting'] as const) {
      if (account[role]?.key_auths?.some(([key]) => key === signer))
        return true;
    }
    return account.memo_key === signer;
  } catch {
    return false;
  }
}
