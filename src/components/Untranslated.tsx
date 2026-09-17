import { useTranslation } from 'react-i18next';
import { sentenceParts } from '@/i18n/parts';

// Values a page translator must leave alone (translate="no"): account names,
// app ids, hosts. Chrome's page translation rewrites whatever text it is
// given, and a signer's screens exist so the user can check these exactly.
// Each value is the only child of its own element, so React replaces it whole
// when it changes (see lib/translation-guard.ts), and runs in the direction
// of its own text (globals.css), so "@bob" reads the same on an Arabic page.

/** An account name as `@name`. */
export function Handle({
  name,
  className = '',
}: {
  name: string;
  className?: string;
}) {
  return (
    <span translate="no" className={className || undefined}>
      {`@${name}`}
    </span>
  );
}

/**
 * A translated sentence whose `{placeholder}` values stay as they are: the
 * copy around them is translatable, each value is its own translate="no"
 * element (bold with `bold`). `count` picks the plural form. The sentence is
 * keyed by its key and language, so a different sentence is built fresh
 * rather than reworked from the old one's text.
 */
export function Sentence({
  k,
  values,
  count,
  bold = false,
  valueClassName = '',
}: {
  k: string;
  values: Record<string, string>;
  count?: number;
  bold?: boolean;
  valueClassName?: string;
}) {
  const { t, i18n } = useTranslation();
  const Value = bold ? 'b' : 'span';
  return (
    <span key={`${i18n.language}:${k}`}>
      {sentenceParts(t, k, values, count).map((part, i) =>
        typeof part === 'string' ? (
          part
        ) : (
          <Value
            // biome-ignore lint/suspicious/noArrayIndexKey: the parts of one fixed sentence
            key={i}
            translate="no"
            className={valueClassName || undefined}
          >
            {part.value}
          </Value>
        ),
      )}
    </span>
  );
}
