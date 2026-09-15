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
  isEncrypted as fieldIsEncrypted,
  type Keys,
  needsUpgrade,
  readKeys,
  writeKeys,
} from './keystore';

const STORAGE_KEY = 'vuex__accounts';

interface PersistedAccount {
  password: string; // keystore field: plain | triplesec | v1
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
    return {
      accountsKeychains: parsed.accountsKeychains ?? {},
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

  const keys = await readKeys(field, passcode);
  keyCache.set(username, keys);

  if (needsUpgrade(field) && passcode) {
    // Migrate the old triplesec blob to the new v1 envelope, same passcode. This
    // must not fail the unlock: the keys are already cached, so a failed
    // re-encrypt (e.g. crypto.subtle unavailable) should leave the account
    // unlocked with the old blob, not surface as a wrong-passcode error.
    try {
      state.accountsKeychains[username] = {
        password: await writeKeys(keys, passcode),
      };
      writePersisted(state);
    } catch {
      // keep the legacy blob; the account is unlocked for this session
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
export async function autoUnlockPlaintext(): Promise<void> {
  const { accountsKeychains } = readPersisted();
  let changed = false;
  for (const [username, { password }] of Object.entries(accountsKeychains)) {
    if (keyCache.has(username) || fieldIsEncrypted(password)) continue;
    try {
      keyCache.set(username, await readKeys(password));
      changed = true;
    } catch {
      // A corrupt plaintext blob: skip it rather than break startup.
    }
  }
  if (changed) emit();
}

/** Test seam: clear in-memory keys and the cached snapshot (not storage). */
export function _resetKeyCache(): void {
  keyCache.clear();
  sessionSelected = null;
  snapshot = null;
}
