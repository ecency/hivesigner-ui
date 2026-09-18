// Turn a Hive operation into a short, human-readable sentence for the confirm
// screen — the redesign's answer to complaint theme #4 ("the sign page shows
// raw JSON"). The summary is what the user reads; the raw op is collapsed
// beneath it. Authority is driven by the operation schema (operations.json), so
// it matches what the Nuxt app signs with.
import i18n from '@/i18n';
import { joinParts, sentenceParts, type TextPart } from '@/i18n/parts';
import { type HiveAuthority, isKnownOperation, OPERATIONS } from './operations';

export type { HiveAuthority } from './operations';
export type Operation = [string, Record<string, unknown>];

// A line the confirm screen shows is copy from the dictionary around values
// from the request. "Send 1.000 HIVE to @bob" is the copy "Send " and " to "
// around "1.000 HIVE" and "@bob": the user approves the values, never a
// translation of them (see i18n/parts.ts). Everything here reads the current
// language, and the screen re-renders when it changes.
export { joinParts, type TextPart };

const data = (value: string): TextPart => ({ value });

/** A dictionary sentence with request values in it. */
function sentence(
  key: string,
  values: Record<string, string> = {},
): TextPart[] {
  return sentenceParts(i18n.t, key, values);
}

/** A field label from the dictionary, or the field's own name made readable. */
function fieldLabel(field: string): string {
  const key = `op_field.${field}`;
  return i18n.exists(key) ? i18n.t(key) : humanizeName(field);
}

/** The name of an operation, in the current language. */
export function operationName(name: string): string {
  const key = `op_name.${name}`;
  return isKnownOperation(name) && i18n.exists(key)
    ? i18n.t(key)
    : humanizeName(name);
}

export interface OperationSummary {
  /** One-line human sentence, e.g. "Send 10.000 HIVE to @bob". */
  title: string;
  /** The title in parts (see TextPart). */
  titleParts: TextPart[];
  /** Optional secondary line, e.g. a memo or the vote weight. */
  detail?: string;
  /** The detail in parts, when there is a detail. */
  detailParts?: TextPart[];
  /** Authority this single operation needs, or null when it cannot be determined. */
  authority: HiveAuthority | null;
}

function summary(
  authority: HiveAuthority | null,
  titleParts: TextPart[],
  detailParts?: TextPart[],
): OperationSummary {
  return {
    title: joinParts(titleParts),
    titleParts,
    ...(detailParts ? { detail: joinParts(detailParts), detailParts } : {}),
    authority,
  };
}

function str(value: unknown): string {
  return typeof value === 'string' ? value : String(value ?? '');
}

// Characters that let a value RENDER as something other than what it is: bidi
// overrides and isolates (U+202A-U+202E, U+2066-U+2069, LRM/RLM, ALM),
// zero-width marks and C0/C1 controls. Every value here is attacker-controlled
// text on a confirm screen, so a memo reading "pay 0001 ot" must not be able to
// hide that the bytes say something else. Tabs and newlines collapse to a space
// so a value cannot push the rest of a row out of view.
export function isUnsafeDisplayChar(cp: number): boolean {
  return (
    cp <= 0x1f || // C0 controls
    (cp >= 0x7f && cp <= 0x9f) || // DEL + C1 controls
    cp === 0x61c || // ARABIC LETTER MARK
    (cp >= 0x200b && cp <= 0x200f) || // zero-width marks + LRM/RLM
    cp === 0x2028 || // LINE SEPARATOR
    cp === 0x2029 || // PARAGRAPH SEPARATOR: ends the bidi paragraph, so it
    // breaks a value's isolation and drags the text after it inside
    (cp >= 0x202a && cp <= 0x202e) || // bidi embeddings and overrides
    (cp >= 0x2066 && cp <= 0x2069) || // bidi isolates
    cp === 0xfeff // BOM / zero-width no-break space
  );
}

/** A string safe to render on the confirm screen (see isUnsafeDisplayChar). */
export function safeText(value: string): string {
  let out = '';
  // Iterating a string yields whole code points, so an astral character is
  // never split into lone surrogates.
  for (const ch of value.replace(/[\t\n\r]+/g, ' ')) {
    out += isUnsafeDisplayChar(ch.codePointAt(0) ?? 0) ? '\ufffd' : ch;
  }
  return out;
}

/** str() plus display sanitisation. Use for every attacker-controlled value. */
function txt(value: unknown): string {
  return safeText(str(value));
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
      return summary(
        authority,
        sentence('summary.transfer', {
          amount: txt(p.amount),
          to: `@${txt(p.to)}`,
        }),
        p.memo ? sentence('summary.memo', { memo: txt(p.memo) }) : undefined,
      );
    case 'vote': {
      const weight = Number(p.weight ?? 0);
      const pct = Math.round(weight / 100);
      const post = `@${txt(p.author)}/${txt(p.permlink)}`;
      if (weight === 0)
        return summary(authority, sentence('summary.unvote', { post }));
      return summary(
        authority,
        sentence(weight < 0 ? 'summary.downvote' : 'summary.upvote', { post }),
        [data(`${pct}%`)],
      );
    }
    case 'comment': {
      const isReply = str(p.parent_author) !== '';
      return summary(
        authority,
        isReply
          ? sentence('summary.reply', {
              post: `@${txt(p.parent_author)}/${txt(p.parent_permlink)}`,
            })
          : sentence('summary.post', {
              title: txt(p.title) || txt(p.permlink),
            }),
      );
    }
    case 'custom_json':
      return summary(
        authority,
        sentence('summary.custom_json', { id: txt(p.id) }),
      );
    case 'account_update':
    case 'account_update2':
      return summary(authority, sentence('summary.account_update'));
    default:
      return summary(authority, [operationName(name)]);
  }
}

export interface OperationField {
  label: string;
  value: string;
  /**
   * The value in parts, when it mixes copy with request values (see
   * TextPart). Without it the whole value is request data.
   */
  parts?: TextPart[];
  /** The label is a key from a JSON payload, i.e. chosen by the caller. */
  untrusted?: boolean;
  /** The operation field a row names, for a row that names one. */
  field?: string;
}

function describeAuthority(value: unknown): TextPart[] {
  const a = value as {
    weight_threshold?: unknown;
    key_auths?: [string, number][];
    account_auths?: [string, number][];
  } | null;
  if (!a || typeof a !== 'object') return [];
  // These come straight from a decoded /sign payload, so an entry can be any
  // JSON value, not the [name, weight] tuple the type claims. Destructuring a
  // non-array threw and took the whole confirm screen down, which is a way to
  // stop a user inspecting an authority change. Render whatever is there.
  const entry = (v: unknown): [string, string] =>
    Array.isArray(v) ? [txt(v[0]), txt(v[1])] : [txt(v), '?'];
  const list = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
  const keys = list(a.key_auths).map((e) => {
    const [k, w] = entry(e);
    return `${k} (${w})`;
  });
  const accts = list(a.account_auths).map((e) => {
    const [n, w] = entry(e);
    return `@${n} (${w})`;
  });
  // The threshold is material: raising it above the total weight (or an
  // account_auths swap that keeps the same shape) can lock the owner out. Print
  // it for ANY present value, not only a number - the chain coerces a string
  // ("2") or a missing field (signs as 0) just the same, so a typeof check here
  // would let a phishing payload hide exactly the field this row exists to show.
  // The warnings are copy, so a translated page translates them; the values
  // around them are data.
  const threshold: TextPart[] = present(a.weight_threshold)
    ? sentence('summary.threshold', { value: txt(a.weight_threshold) })
    : sentence('summary.threshold_missing');
  const sections: TextPart[][] = [
    threshold,
    // An empty key list is the MATERIAL fact when an authority is replaced:
    // it removes the user's own key. Say it rather than print nothing.
    keys.length
      ? sentence('summary.keys', { keys: keys.join(', ') })
      : sentence('summary.keys_none'),
    accts.length
      ? sentence('summary.accounts', { accounts: accts.join(', ') })
      : [],
  ].filter((section) => section.length > 0);
  const separator = i18n.t('summary.separator');
  return sections.flatMap((section, i) =>
    i === 0 ? section : [separator, ...section],
  );
}

/** A JSON path segment, quoted when it is not a plain identifier so two
 * distinct paths (`a.b` nested vs a literal `"a.b"` key) never render alike. */
function segment(key: string): string {
  // safeText as well as quoting: JSON.stringify does NOT escape bidi controls,
  // so a custom_json KEY containing U+202E would reach the row label and reorder
  // the text the user reads.
  return /^[A-Za-z_][A-Za-z0-9_]*$/.test(key)
    ? key
    : safeText(JSON.stringify(key));
}

/**
 * Flatten a parsed JSON value into path-addressed leaf rows so a JSON payload is
 * shown in full: a truncated inline view could push the harmful part (a token
 * transfer, a different account) past the cut. Arrays index by [i], objects by
 * key. `null` and an empty object/array render as themselves rather than as an
 * empty string or vanishing - clearing a list is a material change.
 */
function flattenJson(value: unknown, prefix = ''): OperationField[] {
  if (value === null) return [{ label: prefix, value: 'null' }];
  if (typeof value !== 'object') return [{ label: prefix, value: txt(value) }];
  const isArray = Array.isArray(value);
  const entries: [string, unknown][] = isArray
    ? (value as unknown[]).map((v, i) => [String(i), v])
    : Object.entries(value);
  if (!entries.length) return [{ label: prefix, value: isArray ? '[]' : '{}' }];
  const rows: OperationField[] = [];
  for (const [k, v] of entries) {
    const path = isArray
      ? `${prefix}[${k}]`
      : prefix
        ? `${prefix}.${segment(k)}`
        : segment(k);
    rows.push(...flattenJson(v, path));
  }
  return rows;
}

/**
 * Push one row per JSON leaf of `raw` under `label`, or the whole raw string
 * when it will not parse. Used for every schema `json` field (custom_json's
 * payload and the account metadata fields) so none of them is summarised away.
 */
function pushJsonRows(
  rows: OperationField[],
  label: string,
  raw: string,
): void {
  let leaves: OperationField[] = [];
  try {
    leaves = flattenJson(JSON.parse(raw));
  } catch {
    leaves = [];
  }
  if (!leaves.length) {
    rows.push({ label, value: safeText(raw) });
    return;
  }
  for (const leaf of leaves)
    rows.push({
      label: leaf.label ? `${label}.${leaf.label}` : label,
      value: leaf.value,
      untrusted: !!leaf.label,
    });
}

/**
 * The account(s) an operation acts AS: the fields the schema defaults to
 * `__signer`. A request may name a DIFFERENT account there, which signs on
 * behalf of an account the user merely co-manages (a treasury or community
 * account whose authority lists them). The old `s` param never covered this, so
 * the confirm screen names the actor and the route warns when it is not the
 * selected account.
 */
export function operationActors(op: Operation): string[] {
  const [name, p] = op;
  const out: string[] = [];
  for (const [field, spec] of Object.entries(OPERATIONS[name]?.schema ?? {})) {
    if (spec.defaultValue !== '__signer') continue;
    // safeText here too: this value is rendered in the foreign-actor alert AND
    // compared against the selected account, so `alice\u200b` would otherwise
    // both defeat the comparison and render as an invisible difference.
    const v = safeText(str(p[field]));
    if (v) out.push(v);
  }
  // custom_json has no schema signer slot; its actor is whoever it requires.
  if (name === 'custom_json')
    for (const key of ['required_auths', 'required_posting_auths'] as const) {
      const list = p[key];
      if (Array.isArray(list))
        for (const a of list) {
          const v = safeText(str(a));
          if (v) out.push(v);
        }
    }
  return [...new Set(out)];
}

/** Rows naming the account(s) the operation acts as (the schema signer slot). */
function actorRows(name: string, p: Record<string, unknown>): OperationField[] {
  const rows: OperationField[] = [];
  for (const [field, spec] of Object.entries(OPERATIONS[name]?.schema ?? {})) {
    if (spec.defaultValue !== '__signer') continue;
    const v = str(p[field]);
    if (v)
      rows.push({ label: fieldLabel(field), value: `@${safeText(v)}`, field });
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
export function operationFields(op: Operation): OperationField[] {
  const [name, p] = op;
  // Name the account being acted AS for every op that has a signer slot, so
  // signing on behalf of another account is never silent (see operationActors).
  const rows: OperationField[] = actorRows(name, p);
  switch (name) {
    case 'transfer':
    case 'vote':
      return rows;
    case 'comment': {
      // The summary states post-vs-reply and the target; permlink, body and
      // json_metadata are otherwise hidden, so a comment op could carry content
      // (or metadata) the user never sees. Show them here.
      if (str(p.permlink))
        rows.push({ label: fieldLabel('permlink'), value: txt(p.permlink) });
      // For a top-level post parent_permlink is the primary tag/community.
      if (str(p.parent_author) === '' && str(p.parent_permlink))
        rows.push({
          label: fieldLabel('community'),
          value: txt(p.parent_permlink),
        });
      if (str(p.body))
        rows.push({ label: fieldLabel('body'), value: txt(p.body) });
      if (str(p.json_metadata))
        pushJsonRows(rows, fieldLabel('metadata'), str(p.json_metadata));
      return rows;
    }
    case 'account_update':
    case 'account_update2': {
      for (const role of ['owner', 'active', 'posting'] as const) {
        if (p[role] !== undefined) {
          const parts = describeAuthority(p[role]);
          rows.push({
            label: fieldLabel(`${role}_authority`),
            value: joinParts(parts),
            parts,
          });
        }
      }
      if (str(p.memo_key))
        rows.push({ label: fieldLabel('memo_key'), value: txt(p.memo_key) });
      // Flatten the metadata rather than describing it. posting_json_metadata
      // holds the profile AND, for an app account, `redirect_uris`, which the
      // OAuth screen trusts as that app's registered callbacks - so "profile
      // metadata changes" could hide registering an attacker's callback.
      if (str(p.json_metadata))
        pushJsonRows(rows, fieldLabel('metadata'), str(p.json_metadata));
      if (str(p.posting_json_metadata))
        pushJsonRows(rows, fieldLabel('profile'), str(p.posting_json_metadata));
      return rows;
    }
    case 'custom_json': {
      rows.push({ label: fieldLabel('id'), value: txt(p.id) });
      const active = p.required_auths;
      if (Array.isArray(active) && active.length)
        rows.push({
          label: fieldLabel('active_auths'),
          value: txt(active.join(', ')),
        });
      const posting = p.required_posting_auths;
      if (Array.isArray(posting) && posting.length)
        rows.push({
          label: fieldLabel('posting_auths'),
          value: txt(posting.join(', ')),
        });
      // Flatten the JSON so every leaf is visible instead of cutting the string
      // at a fixed length (which could hide a transfer amount past the cut).
      if (str(p.json)) pushJsonRows(rows, 'json', str(p.json));
      return rows;
    }
    default:
      for (const [k, v] of Object.entries(p)) {
        // Skip the signer-slot fields actorRows already named.
        if (rows.some((r) => r.field === k)) continue;
        // A schema field gets its label; anything else keeps its own name.
        const label = Object.hasOwn(OPERATIONS[name]?.schema ?? {}, k)
          ? fieldLabel(k)
          : k;
        if (typeof v === 'object' && v !== null)
          pushJsonRows(rows, label, JSON.stringify(v));
        else rows.push({ label, value: txt(v), field: k });
      }
      return rows;
  }
}
