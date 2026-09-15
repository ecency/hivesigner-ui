import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import clsx from 'clsx';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  alertError,
  btnPrimary,
  cardGrid,
  cardTight,
  field,
  h1,
  link,
  muted,
  mutedXs,
  page,
} from '@/components/ui';
import { encodeOp } from '@/lib/hive-uri';
import { OPERATIONS } from '@/lib/operations';

// /signs: the operation directory and request builder, a published contract
// route (the Nuxt footer, navigation and transaction-status screen all link
// here, so old links and bookmarks must keep working). Search filters on the
// operation name or the authority it needs; filling a form and submitting
// encodes the operation and hands it to the normal /sign confirm screen, which
// is what the Nuxt SignOperation component did.
export const Route = createFileRoute('/signs')({
  component: Signs,
});

/**
 * A field whose on-chain value is a real list or map, so its text must be parsed.
 * NOT `json`: those fields (custom_json.json, json_metadata,
 * posting_json_metadata) carry a JSON STRING on chain, so parsing one would make
 * the serializer write an object where the caller asked for a string.
 */
function isStructured(type: string): boolean {
  return type === 'array' || type === 'object';
}

/** A field that holds JSON text: validate the syntax, keep the string. */
function isJsonText(type: string): boolean {
  return type === 'json';
}

/** Either kind gets a textarea and a JSON hint. */
function isJsonEntry(type: string): boolean {
  return isStructured(type) || isJsonText(type);
}

/**
 * The editable text for a default value. String() is wrong for a structured
 * field: an array default like ['__signer'] would render as the bare string
 * "__signer" and an object default as "[object Object]", both of which then get
 * ENCODED that way, so the operation leaves here with a string where the chain
 * expects a list or a map.
 */
function defaultText(spec: { type: string; defaultValue?: unknown }): string {
  const d = spec.defaultValue;
  if (d === undefined || d === null) return '';
  if (typeof d === 'object') return JSON.stringify(d);
  return String(d);
}

function OperationForm({ name }: { name: string }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const schema = OPERATIONS[name].schema;
  const [form, setForm] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      Object.entries(schema).map(([field, spec]) => [field, defaultText(spec)]),
    ),
  );
  const [error, setError] = useState<string | null>(null);

  function submit() {
    // Parse structured fields back into JSON before encoding: processValue
    // passes array/object fields through untouched, so a string here reaches the
    // serializer as a string.
    const payload: Record<string, unknown> = {};
    for (const [field, raw] of Object.entries(form)) {
      const type = schema[field]?.type ?? 'string';
      const text = raw.trim();
      if (isJsonEntry(type)) {
        // A blank entry is OMITTED, never coerced to {} or []. account_update's
        // owner/active/posting are optional objects, and substituting {} made
        // operationAuthority's present() check true, which escalated the request
        // to the OWNER key and sent an authority object with no threshold or
        // auths. Omitting lets processValue apply the schema default, which is
        // exactly what any other /sign entry point produces.
        if (text === '') continue;
        let parsed: unknown;
        try {
          parsed = JSON.parse(text);
        } catch {
          setError(`${field} must be valid JSON for this ${type} field.`);
          return;
        }
        // Structured fields send the parsed value; json fields send the text.
        payload[field] = isStructured(type) ? parsed : raw;
        continue;
      }
      payload[field] = raw;
    }
    setError(null);
    // Same handoff as the Nuxt page: encode the operation and let the /sign
    // confirm screen do the schema processing, authority check and signing, so
    // this page never becomes a second signing path.
    const uri = encodeOp([name, payload]);
    navigate({ to: uri.replace('hive://', '/') as never });
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="mt-2.5 flex flex-col gap-2"
    >
      {Object.keys(schema).map((fieldName) => (
        <div key={fieldName} className="flex flex-col gap-1">
          <label htmlFor={`${name}-${fieldName}`} className={mutedXs}>
            {fieldName}
            {isJsonEntry(schema[fieldName].type) ? ' (JSON)' : ''}
          </label>
          {isJsonEntry(schema[fieldName].type) ? (
            // The `field` recipe is a single-line 44px control; a JSON entry box
            // keeps the same frame but is taller, monospace and evenly padded,
            // so it gets its own string rather than fighting the recipe.
            <textarea
              id={`${name}-${fieldName}`}
              className="box-border h-[68px] w-full rounded-lg border border-line p-2 font-mono text-sm"
              value={form[fieldName]}
              onChange={(e) =>
                setForm({ ...form, [fieldName]: e.target.value })
              }
            />
          ) : (
            <input
              id={`${name}-${fieldName}`}
              className={field}
              value={form[fieldName]}
              onChange={(e) =>
                setForm({ ...form, [fieldName]: e.target.value })
              }
            />
          )}
        </div>
      ))}
      {error && (
        <div role="alert" className={alertError}>
          {error}
        </div>
      )}
      {/* Sized to its label rather than stretched by the column. */}
      <button
        type="submit"
        className={`${btnPrimary} cursor-pointer self-start`}
      >
        {t('signs.sign')}
      </button>
    </form>
  );
}

function Signs() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const q = search.trim().toLowerCase();

  const messageOps = [
    { name: t('message_signing.title'), to: '/signmessage' as const },
    { name: t('message_verification.title'), to: '/verifymessage' as const },
  ].filter((op) => !q || op.name.toLowerCase().includes(q));

  // Matches the Nuxt filter: operation name OR the authority it requires.
  const operations = Object.keys(OPERATIONS).filter((name) => {
    const op = OPERATIONS[name];
    return (
      !q ||
      op.name.toLowerCase().includes(q) ||
      op.authority.toLowerCase().includes(q)
    );
  });

  return (
    <section className={page}>
      <h1 className={h1}>{t('signs.title')}</h1>
      {/* A search box is a form control: it stays a readable width instead of
          growing to the full desktop shell. */}
      <input
        className={`${field} sm:max-w-md`}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={t('signs.search_placeholder')}
      />

      {messageOps.map((op) => (
        <Link key={op.to} to={op.to} className={`${link} text-sm`}>
          {op.name}
        </Link>
      ))}

      {operations.length === 0 && messageOps.length === 0 && (
        <p className={`${muted} m-0`}>{t('signs.nothing_matches')}</p>
      )}

      {/* The operation directory is a list of cards, so it uses the width the
          shell now has: two columns from `sm`, three from `lg`. `items-start`
          keeps an expanded operation from stretching its neighbours. */}
      {operations.length > 0 && (
        <div className={`${cardGrid} items-start`}>
          {operations.map((name) => (
            <details key={name} className={cardTight}>
              <summary className="flex cursor-pointer items-baseline gap-2 text-sm">
                <span className="min-w-0 flex-1 font-semibold">
                  {OPERATIONS[name].name}
                </span>
                <span
                  className={clsx(
                    'shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-semibold uppercase',
                    OPERATIONS[name].authority === 'posting'
                      ? 'bg-ok-bg text-ok'
                      : 'bg-danger-bg text-danger',
                  )}
                >
                  {OPERATIONS[name].authority}
                </span>
              </summary>
              <OperationForm name={name} />
            </details>
          ))}
        </div>
      )}
    </section>
  );
}
