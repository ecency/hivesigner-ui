// The docs page shown last in this document, for DocsView's focus rule:
// moving to another page puts the focus on its title, the first page of a
// visit leaves it where the browser put it. Kept by page rather than as a
// flag: StrictMode runs an effect twice in development. Its own module so the
// root route can mark a page that is not in the docs without loading them.

let lastShown: string | null = null;

/** Record a docs page as shown; whether that is a move from another page. */
export function showDocPage(here: string): boolean {
  const moved = lastShown !== null && lastShown !== here;
  lastShown = here;
  return moved;
}

/** Any page outside the docs: the next docs page is a move, even the same
    one again. */
export function leftDocs(): void {
  lastShown = '';
}

/** For tests: as if nothing had been shown yet. */
export function _resetShownPage(): void {
  lastShown = null;
}
