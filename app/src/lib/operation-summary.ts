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

/**
 * The authority a single operation requires (schema-driven; custom_json is
 * data-dependent). Returns null for an operation not in the schema rather than
 * assuming posting, so an unmapped privileged op never understates the key it
 * needs. Note account_update2's real authority is field-dependent (posting for
 * a profile-only edit, higher to change keys); the schema value is the common
 * profile case and is refined when the account-update flow is ported.
 */
export function operationAuthority(op: Operation): HiveAuthority | null {
  const [name, payload] = op;
  if (name === 'custom_json') {
    const required = (payload as { required_auths?: unknown }).required_auths;
    return Array.isArray(required) && required.length > 0
      ? 'active'
      : 'posting';
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
      const verb = weight < 0 ? 'Downvote' : 'Upvote';
      return {
        title: `${verb} @${str(p.author)}/${str(p.permlink)}`,
        detail: `${pct}%`,
        authority,
      };
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
