import { useTranslation } from 'react-i18next';

// Values a page translator must leave alone (translate="no"): account names,
// app ids, hosts. Chrome's page translation rewrites whatever text it is
// given, and a signer's screens exist so the user can check these exactly.
// Each value is the only child of its own element, so React replaces it whole
// when it changes (see lib/translation-guard.ts).

const ISOLATE = '[unicode-bidi:isolate]';

/** An account name as `@name`. */
export function Handle({
  name,
  className = '',
}: {
  name: string;
  className?: string;
}) {
  return (
    <span translate="no" className={`${ISOLATE} ${className}`.trim()}>
      {`@${name}`}
    </span>
  );
}

const OPEN = '\uE000';
const CLOSE = '\uE001';
const MARKED = new RegExp(`${OPEN}([A-Za-z0-9_]+)${CLOSE}`);

/**
 * A translated sentence whose `{placeholder}` values stay as they are: the
 * copy around them is translatable, each value is its own translate="no"
 * element. The sentence is keyed by its key and language, so a different
 * sentence is built fresh rather than reworked from the old one's text.
 */
export function Sentence({
  k,
  values,
}: {
  k: string;
  values: Record<string, string>;
}) {
  const { t, i18n } = useTranslation();
  const marked: Record<string, string> = {};
  for (const name of Object.keys(values)) {
    marked[name] = `${OPEN}${name}${CLOSE}`;
  }
  // split() with a capture group alternates copy and placeholder names.
  const parts = t(k, marked).split(MARKED);
  return (
    <span key={`${i18n.language}:${k}`}>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          // biome-ignore lint/suspicious/noArrayIndexKey: the parts of one fixed sentence
          <span key={i} translate="no" className={ISOLATE}>
            {values[part] ?? ''}
          </span>
        ) : (
          part
        ),
      )}
    </span>
  );
}
