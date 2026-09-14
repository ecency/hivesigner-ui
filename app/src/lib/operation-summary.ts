// Turn a Hive operation into a short, human-readable sentence for the confirm
// screen. This is the redesign's answer to complaint theme #4 ("the sign page
// shows raw JSON"): the summary is what the user reads, the raw op is collapsed
// beneath it.
//
// The current Nuxt app renders every operation field verbatim from a schema
// table (src/assets/data/operations.json); the summaries here cover the common
// operations first and fall back to a readable title for the rest, so no
// operation is ever a blank screen. Extended as flows are ported (#102).

export type Operation = [string, Record<string, unknown>];

export type HiveAuthority = 'posting' | 'active' | 'owner';

export interface OperationSummary {
  /** One-line human sentence, e.g. "Send 10.000 HIVE to @bob". */
  title: string;
  /** Optional secondary line, e.g. a memo or the target permlink. */
  detail?: string;
  /** Lowest authority the operation needs. */
  authority: HiveAuthority;
}

function str(value: unknown): string {
  return typeof value === 'string' ? value : String(value ?? '');
}

function humanizeName(name: string): string {
  return name.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());
}

/** The lowest authority a single operation requires. */
export function operationAuthority(op: Operation): HiveAuthority {
  const [name, payload] = op;
  switch (name) {
    case 'transfer':
    case 'transfer_to_vesting':
    case 'withdraw_vesting':
    case 'delegate_vesting_shares':
    case 'transfer_to_savings':
    case 'account_witness_vote':
    case 'account_witness_proxy':
    case 'update_proposal_votes':
      return 'active';
    case 'account_update':
    case 'account_update2':
      return 'owner';
    case 'custom_json': {
      const required = payload.required_auths;
      return Array.isArray(required) && required.length > 0
        ? 'active'
        : 'posting';
    }
    default:
      return 'posting';
  }
}

/** The lowest authority a whole transaction requires (highest across its ops). */
export function transactionAuthority(ops: Operation[]): HiveAuthority {
  const rank: Record<HiveAuthority, number> = {
    posting: 0,
    active: 1,
    owner: 2,
  };
  let highest: HiveAuthority = 'posting';
  for (const op of ops) {
    const a = operationAuthority(op);
    if (rank[a] > rank[highest]) highest = a;
  }
  return highest;
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
    case 'account_update2':
    case 'account_update':
      return { title: 'Update account authorities', authority };
    default:
      return { title: humanizeName(name), authority };
  }
}
