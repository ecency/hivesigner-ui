import { useRouter } from '@tanstack/react-router';
import { useEffect, useRef } from 'react';

/**
 * Set once the user has set off for another page, or the screen is gone. A
 * screen checks it after every await before an irreversible step (a grant, a
 * broadcast, a token handed to an app), so nothing is done for a user who
 * left meanwhile.
 *
 * Unmounting alone is too late to be the signal. Routes are lazy chunks, and
 * the router keeps this screen mounted while the next one loads, so Cancel
 * pressed during an unlock still let the grant go out. The latch is set as
 * soon as a navigation to another URL starts. A navigation that ends back on
 * this screen's own URL before it unmounts (Back while the next page was
 * loading) clears it again.
 *
 * The request routes remount on a new URL (remountDeps), so `here` is always
 * the request this screen shows.
 */
export function useLeaveLatch() {
  const router = useRouter();
  const left = useRef(false);
  useEffect(() => {
    // Setup clears it: Strict Mode runs setup, cleanup, setup.
    left.current = false;
    const here = router.state.location.href;
    const offs = [
      router.subscribe('onBeforeNavigate', (e) => {
        if (e.toLocation.href !== here) left.current = true;
      }),
      router.subscribe('onResolved', (e) => {
        if (e.toLocation.href === here) left.current = false;
      }),
    ];
    return () => {
      left.current = true;
      for (const off of offs) off();
    };
  }, [router]);
  return left;
}
