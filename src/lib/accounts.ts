// The account store: which accounts are on this device, which is selected, and
// (in memory only) the keys of unlocked accounts.
//
// Persistence uses the same localStorage shape the Nuxt app wrote
// (`vuex__accounts` = { accountsKeychains: { <user>: { password } }, selectedAccount }),
// so a user who already had accounts keeps them. Unlike the old app, decrypted
// private keys are NOT persisted (the old app kept plaintext WIFs in
// vuex__auth); they live in memory for the session only. On first unlock a
// legacy triplesec account is transparently re-encrypted into the v1 envelope.
import {
  encodePlain,
  isEncrypted as fieldIsEncrypted,
  type Keys,
  needsUpgrade,
  readKeys,
  writeKeys,
} from './keystore';

const STORAGE_KEY = 'vuex__accounts';

interface PersistedAccount {
  password: string; // keystore field: plain | triplesec | v1
  // The Nuxt app ALSO stored keys as plaintext siblings of `password`: the
  // import form wrote every no-passcode key beside it, and /auths wrote a key
  // added later ONLY as a sibling. They are read once and folded into the
  // keystore field (see foldLegacySiblings), never written back.
  owner?: string;
  active?: string;
  posting?: string;
  memo?: string;
}

/**
 * Whether a legacy triplesec blob is re-encrypted into the v1 envelope on
 * unlock. OFF for the cutover window: the Nuxt app cannot read a v1 envelope,
 * so a passcode user who had unlocked once here would be locked out by a
 * rollback to the previous image. Turn on once a rollback is no longer on the
 * table. Accounts first imported here WITH a passcode are v1 regardless.
 */
const UPGRADE_TRIPLESEC_ON_UNLOCK = false;

const SIBLING_ROLES = ['owner', 'active', 'posting', 'memo'] as const;
const WIF_RE = /^[5KL][1-9A-HJ-NP-Za-km-z]{50,51}$/;

/** The plaintext WIFs the Nuxt app left beside the keystore field, if any. */
function legacySiblings(record: PersistedAccount): Keys {
  const out: Keys = {};
  for (const role of SIBLING_ROLES) {
    const v = record[role];
    if (typeof v === 'string' && WIF_RE.test(v)) out[role] = v;
  }
  return out;
}

function stripSiblings(record: PersistedAccount): PersistedAccount {
  return { password: record.password };
}
interface PersistedState {
  accountsKeychains: Record<string, PersistedAccount>;
  selectedAccount: string;
}

export interface AccountsState {
  usernames: string[];
  selectedAccount: string | null;
  /** Usernames currently unlocked this session. */
  unlocked: string[];
}

// In-memory only. Never persisted.
const keyCache = new Map<string, Keys>();

// The account selected THIS SESSION. It exists because writePersisted swallows a
// storage failure (private window, blocked storage, quota): without it an
// account added in that state was listed and unlocked but selectedAccount stayed
// null and selectAccount refused it, so the keys the user had just imported
// could never be used for signing.
let sessionSelected: string | null = null;

function readPersisted(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { accountsKeychains: {}, selectedAccount: '' };
    const parsed = JSON.parse(raw) as Partial<PersistedState>;
    const accountsKeychains: Record<string, PersistedAccount> = {};
    for (const [name, rec] of Object.entries(parsed.accountsKeychains ?? {})) {
      if (!rec || typeof rec !== 'object' || typeof rec.password !== 'string')
        continue;
      // Keep the legacy siblings until they have been folded in; a write that
      // dropped them silently lost every key the old /auths page had added.
      accountsKeychains[name] = {
        password: rec.password,
        ...legacySiblings(rec),
      };
    }
    return {
      accountsKeychains,
      selectedAccount: parsed.selectedAccount ?? '',
    };
  } catch {
    return { accountsKeychains: {}, selectedAccount: '' };
  }
}

/** True when the state actually reached storage. */
function writePersisted(state: PersistedState): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    // A private window or blocked storage: the session still works from
    // keyCache; it just will not persist. Never throw from the store.
    return false;
  }
}

// --- subscription (for useSyncExternalStore) ---------------------------------

const listeners = new Set<() => void>();

// useSyncExternalStore requires a STABLE snapshot reference between changes:
// returning a fresh object from getState() every call makes it see a change on
// every render and loop forever. Cache the snapshot and rebuild only on emit().
let snapshot: AccountsState | null = null;

function emit() {
  snapshot = null; // invalidate; next getState() rebuilds
  for (const l of listeners) l();
}
export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getState(): AccountsState {
  if (snapshot) return snapshot;
  const { accountsKeychains, selectedAccount } = readPersisted();
  // Union with the in-memory cache: writePersisted swallows a storage failure
  // (private window, blocked storage, quota), and without this the account would
  // be unlocked and able to sign yet absent from the account list. It still
  // disappears on reload, which is correct - nothing was stored.
  const usernames = [
    ...new Set([...Object.keys(accountsKeychains), ...keyCache.keys()]),
  ];
  const persistedChoice =
    selectedAccount && usernames.includes(selectedAccount)
      ? selectedAccount
      : null;
  const sessionChoice =
    sessionSelected && usernames.includes(sessionSelected)
      ? sessionSelected
      : null;
  snapshot = {
    usernames,
    // THIS SESSION'S choice wins. sessionSelected is only ever set by an
    // explicit action in this session, and it starts null on a fresh load, so
    // the persisted value still governs a reload. Preferring the persisted value
    // instead meant that once a write started failing, clicking Bob silently
    // kept Alice selected - and on a signer that is the account you sign as.
    selectedAccount: sessionChoice ?? persistedChoice,
    unlocked: [...keyCache.keys()],
  };
  return snapshot;
}

// --- queries -----------------------------------------------------------------

export function hasAccounts(): boolean {
  return Object.keys(readPersisted().accountsKeychains).length > 0;
}

/** Whether unlocking this account needs a passcode (encrypted at rest). */
export function accountIsEncrypted(username: string): boolean {
  const field = readPersisted().accountsKeychains[username]?.password;
  return field ? fieldIsEncrypted(field) : false;
}

export function isUnlocked(username: string): boolean {
  return keyCache.has(username);
}

/** The unlocked keys for an account, or null if it is locked this session. */
export function getKeys(username: string): Keys | null {
  return keyCache.get(username) ?? null;
}

// --- mutations ---------------------------------------------------------------

/**
 * Add (or replace) an account. `keys` are stored via the keystore: encrypted
 * under `passcode`, or as the legacy plaintext form when no passcode is given.
 * The account is left unlocked in memory and becomes selected if none was.
 */
export async function addAccount(
  username: string,
  keys: Keys,
  passcode?: string,
): Promise<void> {
  // Merge with the account's existing keys so importing a second key (e.g.
  // active after posting) ADDS to the set instead of replacing it - even for an
  // account that is only in storage (locked after a reload), read with the same
  // passcode. If the stored record cannot be read (a different passcode), the
  // new import stands on its own rather than pretending to merge.
  const state = readPersisted();
  const existingField = state.accountsKeychains[username]?.password;
  let stored: Keys = {};
  if (existingField) {
    if (fieldIsEncrypted(existingField)) {
      // Never silently downgrade a protected account to plaintext.
      if (!passcode) {
        throw new Error(
          'accounts: this account is protected; enter its passcode to add a key',
        );
      }
      // A WRONG passcode must fail loudly, not be swallowed: catching here would
      // drop the existing keys and re-save the record under the mistyped
      // passcode. readKeys throws on a bad passcode; let it propagate.
      stored = await readKeys(existingField, passcode);
    } else {
      // Plaintext existing record: tolerate a corrupt blob and start fresh.
      try {
        stored = await readKeys(existingField);
      } catch {
        stored = {};
      }
    }
  }
  const merged: Keys = {
    ...stored,
    ...(keyCache.get(username) ?? {}),
    ...keys,
  };
  const field = await writeKeys(merged, passcode);
  state.accountsKeychains[username] = { password: field };
  if (!state.selectedAccount) state.selectedAccount = username;
  writePersisted(state);
  keyCache.set(username, merged);
  // Mirror the selection in volatile state, so a rejected write still leaves the
  // account selectable for this session.
  if (!sessionSelected) sessionSelected = state.selectedAccount || username;
  emit();
}

/**
 * Unlock a stored account. `passcode` is required for an encrypted account.
 * Throws (keystore error) on a wrong passcode. A legacy triplesec account is
 * re-encrypted into the v1 envelope on success.
 */
export async function unlockAccount(
  username: string,
  passcode?: string,
): Promise<Keys> {
  const state = readPersisted();
  const field = state.accountsKeychains[username]?.password;
  if (!field) throw new Error(`accounts: no such account ${username}`);

  const record = state.accountsKeychains[username];
  // Keys the old /auths page stored ONLY as plaintext siblings of the blob:
  // fold them in now that the passcode is at hand.
  const siblings = legacySiblings(record);
  const keys: Keys = { ...siblings, ...(await readKeys(field, passcode)) };
  keyCache.set(username, keys);

  const hasSiblings = Object.keys(siblings).length > 0;
  const upgrade = UPGRADE_TRIPLESEC_ON_UNLOCK && needsUpgrade(field);
  if (passcode && (hasSiblings || upgrade)) {
    // Must not fail the unlock: the keys are already cached, so a failed
    // re-encrypt (e.g. crypto.subtle unavailable) leaves the account unlocked
    // with the old blob rather than surfacing as a wrong-passcode error.
    try {
      if (needsUpgrade(field) && !UPGRADE_TRIPLESEC_ON_UNLOCK) {
        // Keep the blob the old app can read (rollback window). The folded
        // keys stay in memory for this session; the plaintext siblings are
        // the greater harm and go now. Re-import the key once the upgrade
        // is switched on if it is still needed.
        state.accountsKeychains[username] = stripSiblings(record);
      } else {
        state.accountsKeychains[username] = {
          password: await writeKeys(keys, passcode),
        };
      }
      writePersisted(state);
    } catch {
      // keep the record as it is; the account is unlocked for this session
    }
  }
  emit();
  return keys;
}

export function selectAccount(username: string): void {
  const state = readPersisted();
  // An account may exist only in memory (its write was rejected). It is listed
  // and unlocked, so it has to be selectable or its keys are unusable.
  if (!state.accountsKeychains[username] && !keyCache.has(username)) return;
  sessionSelected = username;
  state.selectedAccount = username;
  writePersisted(state);
  emit();
}

export function removeAccount(username: string): boolean {
  const state = readPersisted();
  delete state.accountsKeychains[username];
  if (state.selectedAccount === username) {
    state.selectedAccount = Object.keys(state.accountsKeychains)[0] ?? '';
  }
  const stored = writePersisted(state);
  keyCache.delete(username);
  if (sessionSelected === username) {
    sessionSelected = state.selectedAccount || null;
  }
  emit();
  // False means the record is gone from this session but still on disk, so it
  // returns on reload. The caller must say so rather than report success.
  return stored;
}

/** Lock an account (drop its in-memory keys) without removing it. */
export function lockAccount(username: string): void {
  keyCache.delete(username);
  emit();
}

/**
 * Load into memory every plaintext (no-passcode) account that is not already
 * unlocked. Plaintext accounts have no passcode, so keeping them "locked" after
 * a reload gives no security and just breaks signing; the app calls this at
 * startup. Encrypted accounts are untouched (they need their passcode).
 */
/**
 * Import accounts still held under the ORIGINAL `keychain` localStorage key.
 *
 * Before April 2021 the app stored `{ "<username>": "<keystore blob>" }` there,
 * and a Nuxt plugin (plugins/transform-old-keychain.ts) moved them into
 * `vuex__accounts` on every page load. Deleting the Nuxt app deletes that
 * plugin, so anyone who saved keys before that date and has not opened the site
 * since would arrive at an empty account list with no way back: those keys are
 * the only copy on that device.
 *
 * Runs before autoUnlockPlaintext so a migrated plaintext account is usable in
 * the same startup. Two deliberate differences from the plugin it replaces:
 *
 * - an account already in `vuex__accounts` is NOT overwritten, so a stale
 *   legacy blob cannot replace a newer keystore;
 * - the legacy key is removed only once the new state has actually reached
 *   storage. The old plugin deleted it unconditionally, which in a private
 *   window or with storage full would have destroyed the only copy.
 */
const LEGACY_NAME_RE = /^[a-z][a-z0-9.-]{2,15}$/;

export function migrateLegacyKeychain(): boolean {
  const LEGACY_KEY = 'keychain';
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(LEGACY_KEY);
  } catch {
    return false;
  }
  if (!raw) return false;

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return false;
    }
    const state = readPersisted();
    let added = false;
    let skipped = false;
    for (const [username, password] of Object.entries(
      parsed as Record<string, unknown>,
    )) {
      if (typeof password !== 'string' || !password) continue;
      // Hive account names only. This is not tidying: without it `__proto__`
      // as a key would set the object's PROTOTYPE rather than an entry, and a
      // name the chain cannot issue has no account behind it anyway.
      if (!LEGACY_NAME_RE.test(username)) {
        skipped = true;
        continue;
      }
      // Object.hasOwn, NOT a truthiness check on the index. `constructor` is a
      // perfectly valid Hive account name, and `keychains['constructor']`
      // resolves to Object.prototype.constructor - truthy - so that account
      // read as "already migrated", was never copied across, and then the
      // legacy key was deleted underneath it. Every inherited name on
      // Object.prototype was the same trap.
      if (Object.hasOwn(state.accountsKeychains, username)) continue;
      state.accountsKeychains[username] = { password };
      added = true;
    }
    // An entry we refused to carry across is a reason to KEEP the legacy data:
    // deleting it would destroy the only copy of something we chose not to
    // read. Only a clean pass may clear it.
    if (skipped) {
      if (added) {
        if (!writePersisted(state)) return false;
        emit();
        return true;
      }
      return false;
    }
    if (!added) {
      // Nothing to carry over (already migrated, or every entry unusable):
      // drop the legacy key so this does not run again.
      try {
        localStorage.removeItem(LEGACY_KEY);
      } catch {
        // best effort
      }
      return false;
    }
    if (!state.selectedAccount) {
      state.selectedAccount = Object.keys(state.accountsKeychains)[0] ?? '';
    }
    if (!writePersisted(state)) return false;
    try {
      localStorage.removeItem(LEGACY_KEY);
    } catch {
      // The accounts are safely in the new key; a leftover legacy key is
      // harmless, and the next run will find nothing new to add.
    }
    emit();
    return true;
  } catch {
    // Unparsable legacy data: leave it alone rather than destroy it.
    return false;
  }
}

export async function autoUnlockPlaintext(): Promise<void> {
  const state = readPersisted();
  let changed = false;
  let rewrite = false;
  for (const [username, record] of Object.entries(state.accountsKeychains)) {
    if (keyCache.has(username) || fieldIsEncrypted(record.password)) continue;
    try {
      // The Nuxt import form wrote every no-passcode key as a plaintext
      // sibling too, and /auths wrote a later key ONLY as a sibling. Fold
      // them into the blob so nothing is lost, then drop them.
      const siblings = legacySiblings(record);
      const keys: Keys = { ...siblings, ...(await readKeys(record.password)) };
      keyCache.set(username, keys);
      changed = true;
      if (Object.keys(siblings).length > 0) {
        state.accountsKeychains[username] = { password: encodePlain(keys) };
        rewrite = true;
      }
    } catch {
      // A corrupt plaintext blob: skip it rather than break startup.
    }
  }
  if (rewrite) writePersisted(state);
  if (changed) emit();
}

/**
 * The Nuxt app persisted its `auth` store to `vuex__auth`, with the last
 * login's keys in PLAINTEXT. Nothing here reads it; delete it so those keys
 * do not sit in storage for ever.
 */
export function removeLegacyAuthStore(): boolean {
  try {
    if (localStorage.getItem('vuex__auth') === null) return false;
    localStorage.removeItem('vuex__auth');
    return true;
  } catch {
    return false;
  }
}

/** Test seam: clear in-memory keys and the cached snapshot (not storage). */
export function _resetKeyCache(): void {
  keyCache.clear();
  sessionSelected = null;
  snapshot = null;
}
