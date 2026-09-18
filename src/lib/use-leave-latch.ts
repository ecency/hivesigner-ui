import { type ParsedLocation, useRouter } from '@tanstack/react-router';
import { useEffect, useMemo, useRef } from 'react';

/** The request a URL names. The hash is not part of it: an in-page
    fragment (a hand-edited URL, an external `#` link) is not leaving. */
const requestOf = (l: ParsedLocation) => `${l.pathname}${l.searchStr}`;

export interface LeaveLatch {
  /**
   * Taken when an action starts (its click). The check it returns is true
   * once the user has set off for another page since, or the screen is gone,
   * and it stays true: coming back does not revive an action already on its
   * way. A new click takes a new mark, so the screen keeps working.
   */
  mark(): () => boolean;
}

/**
 * Whether the user left while an action was in flight. A screen checks it
 * after every await before an irreversible step (a grant, a broadcast, a
 * token handed to an app), so nothing is done for a user who left meanwhile.
 *
 * Unmounting alone is too late to be the signal. Routes are lazy chunks, and
 * the router keeps this screen mounted while the next one loads, so Cancel
 * pressed during an unlock still let the grant go out. A leave counts from
 * the moment a navigation to another request starts. The request routes
 * remount on a new URL (remountDeps), so `here` is the request on screen.
 */
export function useLeaveLatch(): LeaveLatch {
  const router = useRouter();
  const state = useRef({ leaves: 0, gone: false });
  useEffect(() => {
    const s = state.current;
    // Setup clears it: Strict Mode runs setup, cleanup, setup.
    s.gone = false;
    return () => {
      s.gone = true;
    };
  }, []);
  useEffect(() => {
    const s = state.current;
    const here = requestOf(router.state.location);
    return router.subscribe('onBeforeNavigate', (e) => {
      if (requestOf(e.toLocation) !== here) s.leaves++;
    });
  }, [router]);
  return useMemo(
    () => ({
      mark() {
        const s = state.current;
        const at = s.leaves;
        return () => s.gone || s.leaves !== at;
      },
    }),
    [],
  );
}
