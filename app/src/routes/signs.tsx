import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { type CSSProperties, useState } from 'react';
import { useTranslation } from 'react-i18next';
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

const fld: CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  height: 40,
  padding: '0 12px',
  border: '1px solid #d1d9e0',
  borderRadius: 8,
  fontSize: 14,
};

const card: CSSProperties = {
  background: '#fff',
  border: '1px solid #d1d9e0',
  borderRadius: 12,
  padding: '12px 14px',
};

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
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        marginTop: 10,
      }}
    >
      {Object.keys(schema).map((field) => (
        <div
          key={field}
          style={{ display: 'flex', flexDirection: 'column', gap: 4 }}
        >
          <label
            htmlFor={`${name}-${field}`}
            style={{ fontSize: 12, color: '#59636e' }}
          >
            {field}
            {isJsonEntry(schema[field].type) ? ' (JSON)' : ''}
          </label>
          {isJsonEntry(schema[field].type) ? (
            <textarea
              id={`${name}-${field}`}
              style={{
                ...fld,
                height: 68,
                padding: 8,
                fontFamily: 'ui-monospace, monospace',
              }}
              value={form[field]}
              onChange={(e) => setForm({ ...form, [field]: e.target.value })}
            />
          ) : (
            <input
              id={`${name}-${field}`}
              style={fld}
              value={form[field]}
              onChange={(e) => setForm({ ...form, [field]: e.target.value })}
            />
          )}
        </div>
      ))}
      {error && (
        <div role="alert" style={{ fontSize: 12.5, color: '#cf222e' }}>
          {error}
        </div>
      )}
      <button
        type="submit"
        style={{
          height: 42,
          border: 'none',
          borderRadius: 8,
          background: '#E31337',
          color: '#fff',
          fontWeight: 600,
          cursor: 'pointer',
          alignSelf: 'flex-start',
          padding: '0 20px',
        }}
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
    <section
      style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}
    >
      <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>
        {t('signs.title')}
      </h1>
      <input
        style={fld}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={t('signs.search_placeholder')}
      />

      {messageOps.map((op) => (
        <Link key={op.to} to={op.to} style={{ fontSize: 14 }}>
          {op.name}
        </Link>
      ))}

      {operations.length === 0 && messageOps.length === 0 && (
        <p style={{ fontSize: 13.5, color: '#59636e', margin: 0 }}>
          Nothing matches that.
        </p>
      )}

      {operations.map((name) => (
        <details key={name} style={card}>
          <summary
            style={{
              cursor: 'pointer',
              fontSize: 14,
              display: 'flex',
              gap: 8,
              alignItems: 'baseline',
            }}
          >
            <span style={{ fontWeight: 600, flex: 1 }}>
              {OPERATIONS[name].name}
            </span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                textTransform: 'uppercase',
                padding: '2px 6px',
                borderRadius: 6,
                background:
                  OPERATIONS[name].authority === 'posting'
                    ? '#eaf5ea'
                    : '#ffebe9',
                color:
                  OPERATIONS[name].authority === 'posting'
                    ? '#1a7f37'
                    : '#cf222e',
              }}
            >
              {OPERATIONS[name].authority}
            </span>
          </summary>
          <OperationForm name={name} />
        </details>
      ))}
    </section>
  );
}
