import { createFileRoute } from '@tanstack/react-router';
import { GrantAction } from '@/components/GrantAction';

// Revoke an app's posting authority (legacy /revoke/:username URL).
export const Route = createFileRoute('/revoke/$username')({
  component: Revoke,
  // The legacy grant detour arrives with `redirect_uri` (see grantReturnTarget).
  validateSearch: (s: Record<string, unknown>) => s as Record<string, string>,
});

function Revoke() {
  const { username } = Route.useParams();
  const search = Route.useSearch();
  return (
    <GrantAction
      appName={username.replace(/^@/, '')}
      mode="revoke"
      query={search}
    />
  );
}
