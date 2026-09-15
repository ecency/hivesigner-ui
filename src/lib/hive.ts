// The app's Hive chain layer, built on @ecency/sdk/hive.
//
// The SDK is used in place of dhive and a hand-rolled client: callRPC has
// multi-node failover, health tracking, adaptive timeouts and hedging, and its
// crypto (PrivateKey/PublicKey/Signature) is browser-native (@noble, no Buffer),
// verified against dhive vectors in hive.test.ts. This module is the single
// import point for chain reads, key derivation, credential checks and message
// signing; the rest of the app never imports the SDK directly.
import { callRPC, PrivateKey, Signature } from '@ecency/sdk/hive';
import { sha256 } from '@noble/hashes/sha2.js';

// Defined locally: @ecency/sdk/hive does not re-export the KeyRole type from its
// entry, though PrivateKey.fromLogin accepts this exact union structurally.
export type KeyRole = 'owner' | 'active' | 'posting' | 'memo';

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

// The account whose post and follow list define the app directory. Both are
// curated by the Hivesigner maintainers on-chain, which is why the app needs no
// directory service of its own.
const ORACLE = 'hivesigner';
const TOP_APPS_PERMLINK = 'top-apps';

/** A Hive account name, as the chain allows it. */
const USERNAME_RE = /^[a-z][a-z0-9.-]{2,15}$/;

function isUsername(value: unknown): value is string {
  return typeof value === 'string' && USERNAME_RE.test(value);
}

/** The curated top-apps list published on the @hivesigner/top-apps post. */
export async function getTopApps(): Promise<string[]> {
  try {
    const content = (await callRPC('condenser_api.get_content', [
      ORACLE,
      TOP_APPS_PERMLINK,
    ])) as Content;
    const data = JSON.parse(content.json_metadata || '{}').data;
    return Array.isArray(data) ? data.filter(isUsername) : [];
  } catch {
    return [];
  }
}

interface FollowRow {
  following: string;
}

/**
 * EVERY app registered with Hivesigner: the accounts @hivesigner follows.
 *
 * This is the directory the Nuxt app had and the rewrite dropped, leaving
 * /apps showing only the eight curated entries. It is ~900 accounts, so it
 * pages 100 at a time.
 *
 * `start` is the last name seen and the node ECHOES it as the first row of the
 * next page, so the result is deduplicated at the end. That is the ONE thing
 * standing between the page size and nine duplicate cards in a ~900-entry
 * directory, so it is not tidying.
 *
 * A failed page returns what was collected rather than throwing: a partial
 * directory is worth more than an empty one, and the caller cannot tell the
 * difference anyway.
 */
export async function getAllApps(): Promise<string[]> {
  const STEP = 100;
  // 20 pages is ~2000 accounts, well past the current ~900. It exists so a node
  // that ignores `start` cannot spin this loop forever.
  const MAX_PAGES = 20;
  const names: string[] = [];
  let start = '';

  try {
    for (let page = 0; page < MAX_PAGES; page++) {
      const rows = (await callRPC('condenser_api.get_following', [
        ORACLE,
        start,
        'blog',
        STEP,
      ])) as FollowRow[];
      if (!Array.isArray(rows) || rows.length === 0) break;
      names.push(...rows.map((r) => r?.following).filter(isUsername));
      if (rows.length < STEP) break;
      const last = names[names.length - 1];
      // No forward progress (a node that ignored `start`): stop rather than
      // request the same page forever.
      if (!last || last === start) break;
      start = last;
    }
  } catch {
    // keep what arrived
  }

  return [...new Set(names)];
}

/** The public profile an app publishes in its posting_json_metadata. */
export interface Profile {
  username: string;
  name?: string;
  about?: string;
  website?: string;
  creator?: string;
}

function readProfile(account: Account): Profile {
  const out: Profile = { username: account.name };
  try {
    const p = JSON.parse(account.posting_json_metadata || '{}').profile;
    if (!p || typeof p !== 'object') return out;
    // Every field here is written by the account itself, so nothing is trusted:
    // strings only, length-capped, and sanitised for display by the caller.
    for (const key of ['name', 'about', 'website', 'creator'] as const) {
      const v = (p as Record<string, unknown>)[key];
      if (typeof v === 'string' && v.trim()) out[key] = v.slice(0, 500);
    }
  } catch {
    // unparsable metadata is simply no profile
  }
  return out;
}

/**
 * Profiles for a set of accounts, in ONE call per 100 names.
 *
 * Only the accounts actually on screen are fetched. The directory is ~900
 * entries and a full account object is a few KB, so fetching all of them to
 * show a name and a one-line description would cost megabytes.
 */
export async function getProfiles(
  names: string[],
): Promise<Record<string, Profile>> {
  const wanted = names.filter(isUsername);
  if (wanted.length === 0) return {};
  const out: Record<string, Profile> = {};
  for (let i = 0; i < wanted.length; i += 100) {
    const accounts = await getAccounts(wanted.slice(i, i + 100));
    for (const account of accounts ?? []) {
      if (account?.name) out[account.name] = readProfile(account);
    }
  }
  return out;
}

/**
 * SP-per-VEST, for converting HP amounts. REJECTS on RPC failure or a nonsense
 * rate rather than returning a fallback, so a caller (React Query) can tell a
 * real, validated rate from "unknown" and refuse to sign an HP amount without
 * one. Do not swallow the error here.
 */
export async function getVestsToSp(): Promise<number> {
  const p = await getDynamicGlobalProperties();
  const sp =
    Number.parseFloat(p.total_vesting_fund_hive) /
    Number.parseFloat(p.total_vesting_shares);
  if (!Number.isFinite(sp) || sp <= 0) {
    throw new Error('Invalid vesting rate from node');
  }
  return sp;
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
 * EVERY role a private key can sign for ON ITS OWN. owner/active/posting are
 * matched against key_auths; memo against memo_key. This is the login credential
 * check: a key the user pastes is accepted only when its public key is actually
 * on the account on-chain.
 *
 * Two things this must get right. A key whose weight is below the authority's
 * weight_threshold cannot sign alone, so accepting it would let the app offer to
 * sign and then fail only at broadcast (a multisig account's co-signer key).
 * And one public key can legitimately sit in several authorities, so returning
 * only the first match would store it under one role and then report the key as
 * missing when a different authority is needed.
 */
export function keyRolesForAccount(account: Account, wif: string): KeyRole[] {
  const pub = publicKeyFromWif(wif);
  if (!pub) return [];
  const roles: KeyRole[] = [];
  for (const role of ['owner', 'active', 'posting'] as const) {
    const auth = account[role];
    const entry = auth?.key_auths?.find(([key]) => key === pub);
    if (!auth || !entry) continue;
    const weight = Number(entry[1] ?? 0);
    // Absent threshold defaults to 1, the chain's own default.
    const threshold = Number(auth.weight_threshold ?? 1);
    if (Number.isFinite(weight) && weight >= threshold) roles.push(role);
  }
  if (account.memo_key === pub) roles.push('memo');
  return roles;
}

/** The strongest single role a key can sign for, or null for none. */
export function keyRoleForAccount(
  account: Account,
  wif: string,
): KeyRole | null {
  return keyRolesForAccount(account, wif)[0] ?? null;
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
  // A single WIF: store it under EVERY role it can sign for, not just the first.
  const roles = keyRolesForAccount(account, secret);
  if (roles.length) {
    const single: Keys = {};
    for (const r of roles) single[r] = secret;
    return single;
  }

  // A master password: derive, keep only roles whose pubkey is on the account.
  const derived = deriveKeysFromMasterPassword(account.name, secret);
  const kept: Keys = {};
  for (const r of ROLES) {
    const wif = derived[r];
    // `.includes(r)`, not `=== r`: a derived key that also sits in a stronger
    // authority would otherwise be dropped for its own role.
    if (wif && keyRolesForAccount(account, wif).includes(r)) kept[r] = wif;
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
