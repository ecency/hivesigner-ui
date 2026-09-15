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
    key_auths?: [string, number][];
    account_auths?: [string, number][];
  } | null;
  if (!a || typeof a !== 'object') return '';
  const keys = (a.key_auths ?? []).map(([k, w]) => `${k} (${w})`);
  const accts = (a.account_auths ?? []).map(([n, w]) => `@${n} (${w})`);
  const parts = [
    keys.length ? `keys: ${keys.join(', ')}` : '',
    accts.length ? `accounts: ${accts.join(', ')}` : '',
  ].filter(Boolean);
  return parts.length ? parts.join('; ') : '(cleared)';
}

/**
 * The material fields to display for an operation whose title does not already
 * capture them. This exists so a dangerous op (account_update giving away an
 * authority, a custom_json token transfer, or any op with no curated summary) is
 * never hidden behind a collapsed JSON block - the user sees what they approve.
 * Returns [] for the fully-summarized transfer/vote/comment.
 */
export function operationFields(op: Operation): OperationField[] {
  const [name, p] = op;
  const rows: OperationField[] = [];
  switch (name) {
    case 'transfer':
    case 'vote':
    case 'comment':
      return [];
    case 'account_update':
    case 'account_update2': {
      if (p.account)
        rows.push({ label: 'Account', value: `@${str(p.account)}` });
      for (const role of ['owner', 'active', 'posting'] as const) {
        if (p[role] !== undefined)
          rows.push({
            label: `${role} authority`,
            value: describeAuthority(p[role]),
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
      const required = p.required_auths;
      if (Array.isArray(required) && required.length) {
        rows.push({ label: 'Active auths', value: required.join(', ') });
      }
      const json = str(p.json);
      rows.push({
        label: 'JSON',
        value: json.length > 400 ? `${json.slice(0, 400)}…` : json,
      });
      return rows;
    }
    default:
      for (const [k, v] of Object.entries(p)) {
        rows.push({
          label: k,
          value: typeof v === 'string' ? v : JSON.stringify(v),
        });
      }
      return rows;
  }
}
