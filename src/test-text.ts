/**
 * A Testing Library matcher for a sentence split across elements: the
 * element whose whole text is `text` (or matches it), and not an ancestor of
 * another such element. Values kept out of page translation are elements of
 * their own (components/Untranslated.tsx, the sign screen's summary parts), so
 * a plain lookup no longer finds the sentence around them.
 */
export function wholeText(text: string | RegExp) {
  const matches = (element: Element) =>
    typeof text === 'string'
      ? element.textContent === text
      : text.test(element.textContent ?? '');
  return (_content: string, element: Element | null): boolean =>
    !!element &&
    matches(element) &&
    Array.from(element.children).every((child) => !matches(child));
}
