import { createFileRoute } from '@tanstack/react-router';
import { GrantAction } from '@/components/GrantAction';

// Grant an app posting authority (legacy /authorize/:username URL).
export const Route = createFileRoute('/authorize/$username')({
  component: Authorize,
  // The legacy grant detour arrives with `redirect_uri` (see grantReturnTarget).
  validateSearch: (s: Record<string, unknown>) => s as Record<string, string>,
});

function Authorize() {
  const { username } = Route.useParams();
  const search = Route.useSearch();
  return (
    <GrantAction
      appName={username.replace(/^@/, '')}
      mode="grant"
      query={search}
    />
  );
}
