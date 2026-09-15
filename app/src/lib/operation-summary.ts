// Turn a Hive operation into a short, human-readable sentence for the confirm
// screen — the redesign's answer to complaint theme #4 ("the sign page shows
// raw JSON"). The summary is what the user reads; the raw op is collapsed
// beneath it. Authority is driven by the operation schema (operations.json), so
// it matches what the Nuxt app signs with.
import { type HiveAuthority, OPERATIONS } from './operations';

export type { HiveAuthority } from './operations';
export type Operation = [string, Record<string, unknown>];

export interface OperationSummary {
  /** One-line human sentence, e.g. "Send 10.000 HIVE to @bob". */
  title: string;
  /** Optional secondary line, e.g. a memo or the vote weight. */
  detail?: string;
  /** Authority this single operation needs, or null when it cannot be determined. */
  authority: HiveAuthority | null;
}

function str(value: unknown): string {
  return typeof value === 'string' ? value : String(value ?? '');
}

function humanizeName(name: string): string {
  return name.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());
}

function present(value: unknown): boolean {
  if (value === undefined || value === null || value === '') return false;
  if (Array.isArray(value) && value.length === 0) return false;
  return true;
}

/**
 * account_update / account_update2 need the authority of whatever they change,
 * not a fixed level: an owner change needs owner; changing the active/posting
 * authorities, the memo key or json_metadata needs active; a
 * posting_json_metadata-only profile edit needs posting.
 */
function accountUpdateAuthority(
  name: string,
  p: Record<string, unknown>,
): HiveAuthority {
  if (present(p.owner)) return 'owner';
  const activeLevelChange =
    present(p.active) || present(p.posting) || present(p.memo_key);
  if (name === 'account_update2') {
    // json_metadata is active-level; posting_json_metadata alone is posting.
    return activeLevelChange || present(p.json_metadata) ? 'active' : 'posting';
  }
  // account_update (v1): active covers key and metadata changes; owner handled above.
  return 'active';
}

/**
 * The authority a single operation requires. custom_json and the account
 * updates are data-dependent; every other op comes from the schema. Returns
 * null for an operation not in the schema rather than assuming posting, so an
 * unmapped privileged op never understates the key it needs.
 */
export function operationAuthority(op: Operation): HiveAuthority | null {
  const [name, payload] = op;
  if (name === 'custom_json') {
    const required = (payload as { required_auths?: unknown }).required_auths;
    return Array.isArray(required) && required.length > 0
      ? 'active'
      : 'posting';
  }
  if (name === 'account_update' || name === 'account_update2') {
    return accountUpdateAuthority(name, payload);
  }
  return OPERATIONS[name]?.authority ?? null;
}

/**
 * The authority needed to sign a whole transaction. Since Hive HF, one key
 * signs one authority level: returns that authority only when every operation
 * needs the same known one, otherwise null — a mixed-authority transaction (or
 * one with an operation whose authority is unknown) cannot be signed with a
 * single key. Mirrors the Nuxt app's getLowestAuthorityRequired.
 */
export function requiredAuthority(ops: Operation[]): HiveAuthority | null {
  const authorities = new Set<HiveAuthority | null>();
  for (const op of ops) authorities.add(operationAuthority(op));
  if (authorities.size !== 1) return null;
  const only = [...authorities][0];
  return only; // null when the single distinct value is itself unknown
}

export function summarizeOperation(op: Operation): OperationSummary {
  const [name, p] = op;
  const authority = operationAuthority(op);

  switch (name) {
    case 'transfer':
      return {
        title: `Send ${str(p.amount)} to @${str(p.to)}`,
        detail: p.memo ? `Memo: ${str(p.memo)}` : undefined,
        authority,
      };
    case 'vote': {
      const weight = Number(p.weight ?? 0);
      const pct = Math.round(weight / 100);
      const target = `@${str(p.author)}/${str(p.permlink)}`;
      if (weight === 0)
        return { title: `Remove vote from ${target}`, authority };
      const verb = weight < 0 ? 'Downvote' : 'Upvote';
      return { title: `${verb} ${target}`, detail: `${pct}%`, authority };
    }
    case 'comment': {
      const isReply = str(p.parent_author) !== '';
      return {
        title: isReply
          ? `Reply to @${str(p.parent_author)}/${str(p.parent_permlink)}`
          : `Publish post "${str(p.title) || str(p.permlink)}"`,
        authority,
      };
    }
    case 'custom_json':
      return { title: `Custom action (${str(p.id)})`, authority };
    case 'account_update':
    case 'account_update2':
      return { title: 'Update account authorities', authority };
    default:
      return { title: humanizeName(name), authority };
  }
}

export interface OperationField {
  label: string;
  value: string;
}

function describeAuthority(value: unknown): string {
  const a = value as {
    weight_threshold?: number;
    key_auths?: [string, number][];
    account_auths?: [string, number][];
  } | null;
  if (!a || typeof a !== 'object') return '';
  const keys = (a.key_auths ?? []).map(([k, w]) => `${k} (${w})`);
  const accts = (a.account_auths ?? []).map(([n, w]) => `@${n} (${w})`);
  const parts = [
    // The threshold is material: raising it above the total weight (or an
    // account_auths swap that keeps the same shape) can lock the owner out, and
    // omitting it made a lockout op look like a no-op.
    typeof a.weight_threshold === 'number'
      ? `threshold ${a.weight_threshold}`
      : '',
    keys.length ? `keys: ${keys.join(', ')}` : '',
    accts.length ? `accounts: ${accts.join(', ')}` : '',
  ].filter(Boolean);
  return parts.length ? parts.join('; ') : '(cleared)';
}

/** Replace the __signer placeholder with the signing account for display. */
function resolveSignerStr(value: string, signer: string): string {
  return signer ? value.replace(/__signer/g, signer) : value;
}

/**
 * Flatten a parsed JSON value into dotted-path leaf rows so a custom_json
 * payload is shown in full: a truncated inline view could push the harmful part
 * (a token transfer, a different account) past the cut. Arrays index by [i],
 * objects by key; primitives at the root return a single value row.
 */
function flattenJson(value: unknown, prefix = ''): OperationField[] {
  if (value === null || typeof value !== 'object') {
    return [{ label: prefix, value: str(value) }];
  }
  const rows: OperationField[] = [];
  const entries: [string, unknown][] = Array.isArray(value)
    ? value.map((v, i) => [`[${i}]`, v])
    : Object.entries(value);
  for (const [k, v] of entries) {
    const isIndex = k.startsWith('[');
    const path = prefix ? (isIndex ? `${prefix}${k}` : `${prefix}.${k}`) : k;
    if (v !== null && typeof v === 'object') rows.push(...flattenJson(v, path));
    else rows.push({ label: path, value: str(v) });
  }
  return rows;
}

/**
 * The material fields to display for an operation whose title does not already
 * capture them. This exists so a dangerous op (account_update giving away an
 * authority, a custom_json token transfer, or any op with no curated summary) is
 * never hidden behind a collapsed JSON block - the user sees what they approve.
 * Returns [] for the fully-summarized transfer/vote. `signer` (the account that
 * will sign) resolves the `__signer` placeholder so a row never shows the raw
 * token instead of the account it stands for.
 */
export function operationFields(op: Operation, signer = ''): OperationField[] {
  const [name, p] = op;
  const rows: OperationField[] = [];
  const resolve = (v: string) => resolveSignerStr(v, signer);
  switch (name) {
    case 'transfer':
    case 'vote':
      return [];
    case 'comment': {
      // The summary states post-vs-reply and the target; permlink, body and
      // json_metadata are otherwise hidden, so a comment op could carry content
      // (or metadata) the user never sees. Show them here.
      if (str(p.permlink))
        rows.push({ label: 'Permlink', value: str(p.permlink) });
      // For a top-level post parent_permlink is the primary tag/community.
      if (str(p.parent_author) === '' && str(p.parent_permlink))
        rows.push({ label: 'Community/tag', value: str(p.parent_permlink) });
      if (str(p.body)) rows.push({ label: 'Body', value: str(p.body) });
      if (str(p.json_metadata))
        rows.push({ label: 'Metadata', value: str(p.json_metadata) });
      return rows;
    }
    case 'account_update':
    case 'account_update2': {
      if (p.account)
        rows.push({ label: 'Account', value: `@${resolve(str(p.account))}` });
      for (const role of ['owner', 'active', 'posting'] as const) {
        if (p[role] !== undefined)
          rows.push({
            label: `${role} authority`,
            value: resolve(describeAuthority(p[role])),
          });
      }
      if (str(p.memo_key))
        rows.push({ label: 'Memo key', value: str(p.memo_key) });
      if (str(p.json_metadata))
        rows.push({ label: 'Metadata', value: 'account metadata changes' });
      if (str(p.posting_json_metadata))
        rows.push({ label: 'Profile', value: 'profile metadata changes' });
      return rows;
    }
    case 'custom_json': {
      rows.push({ label: 'ID', value: str(p.id) });
      const active = p.required_auths;
      if (Array.isArray(active) && active.length)
        rows.push({ label: 'Active auths', value: resolve(active.join(', ')) });
      const posting = p.required_posting_auths;
      if (Array.isArray(posting) && posting.length)
        rows.push({
          label: 'Posting auths',
          value: resolve(posting.join(', ')),
        });
      // Flatten the JSON so every leaf is visible instead of cutting the string
      // at a fixed length (which could hide a transfer amount past the cut). On
      // unparseable JSON fall back to the whole raw string (the card wraps it).
      const json = str(p.json);
      let leaves: OperationField[] = [];
      try {
        leaves = flattenJson(JSON.parse(json));
      } catch {
        leaves = [];
      }
      if (leaves.length)
        for (const leaf of leaves)
          rows.push({
            label: leaf.label ? `json.${leaf.label}` : 'json',
            value: resolve(leaf.value),
          });
      else rows.push({ label: 'JSON', value: resolve(json) });
      return rows;
    }
    default:
      for (const [k, v] of Object.entries(p)) {
        rows.push({
          label: k,
          value: resolve(typeof v === 'string' ? v : JSON.stringify(v)),
        });
      }
      return rows;
  }
}
