import { createFileRoute } from '@tanstack/react-router';
import { GrantAction } from '@/components/GrantAction';

// Grant an app posting authority (legacy /authorize/:username URL).
export const Route = createFileRoute('/authorize/$username')({
  component: Authorize,
});

function Authorize() {
  const { username } = Route.useParams();
  return <GrantAction appName={username.replace(/^@/, '')} mode="grant" />;
}
