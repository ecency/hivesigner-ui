import { createFileRoute } from '@tanstack/react-router';
import { GrantAction } from '@/components/GrantAction';

// Revoke an app's posting authority (legacy /revoke/:username URL).
export const Route = createFileRoute('/revoke/$username')({
  component: Revoke,
});

function Revoke() {
  const { username } = Route.useParams();
  return <GrantAction appName={username.replace(/^@/, '')} mode="revoke" />;
}
