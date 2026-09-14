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
  /** Lowest authority this single operation needs. */
  authority: HiveAuthority;
}

function str(value: unknown): string {
  return typeof value === 'string' ? value : String(value ?? '');
}

function humanizeName(name: string): string {
  return name.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());
}

/** The authority a single operation requires (schema-driven; custom_json is data-dependent). */
export function operationAuthority(op: Operation): HiveAuthority {
  const [name, payload] = op;
  if (name === 'custom_json') {
    const required = (payload as { required_auths?: unknown }).required_auths;
    return Array.isArray(required) && required.length > 0
      ? 'active'
      : 'posting';
  }
  return OPERATIONS[name]?.authority ?? 'posting';
}

/**
 * The authority needed to sign a whole transaction. Since Hive HF, one key
 * signs one authority level: if every operation needs the same authority that
 * is returned, otherwise null (a mixed-authority transaction cannot be signed
 * with a single key). Mirrors the Nuxt app's getLowestAuthorityRequired.
 */
export function requiredAuthority(ops: Operation[]): HiveAuthority | null {
  const authorities = new Set<HiveAuthority>();
  for (const op of ops) authorities.add(operationAuthority(op));
  return authorities.size === 1 ? [...authorities][0] : null;
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
