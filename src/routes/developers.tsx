import { createFileRoute, redirect } from '@tanstack/react-router';

// /developers used to point at the GitBook docs. The docs live at /docs now;
// nginx answers /developers with a permanent redirect there, and this covers
// the app's own navigation and the dev server.
export const Route = createFileRoute('/developers')({
  beforeLoad: () => {
    throw redirect({ to: '/docs', replace: true });
  },
});
