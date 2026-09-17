// A translated sentence with request values in it, as parts.
//
// "Send {amount} to {to}" is looked up with a marker in place of each value
// and split at the markers, so the copy around the values comes from the
// dictionary while each value stays exactly what the request said. Word order
// is the translation's: a language that puts the recipient first just does.
import type { TFunction } from 'i18next';

/**
 * A piece of a line: copy, which a page translator may translate, or a value
 * taken from a request, which is shown exactly as it is.
 */
export type TextPart = string | { value: string };

/** The plain text of a line made of parts. */
export function joinParts(parts: TextPart[]): string {
  return parts
    .map((part) => (typeof part === 'string' ? part : part.value))
    .join('');
}

// Private-use characters: a dictionary never contains them, and a value that
// does is never split, because values are not interpolated at all.
const OPEN = '';
const CLOSE = '';
const MARKED = new RegExp(`${OPEN}([A-Za-z0-9_]+)${CLOSE}`);

/**
 * The parts of `key` with `values` in place. `count`, when given, chooses the
 * plural form and fills `{count}` as copy.
 */
export function sentenceParts(
  t: TFunction,
  key: string,
  values: Record<string, string>,
  count?: number,
): TextPart[] {
  const marked: Record<string, string | number> = {};
  for (const name of Object.keys(values))
    marked[name] = `${OPEN}${name}${CLOSE}`;
  if (count !== undefined) marked.count = count;
  // split() with a capture group alternates copy and placeholder names.
  const pieces = (t(key, marked) as string).split(MARKED);
  const parts: TextPart[] = [];
  pieces.forEach((piece, i) => {
    if (i % 2 === 1) parts.push({ value: values[piece] ?? '' });
    else if (piece) parts.push(piece);
  });
  return parts;
}
