import { createFileRoute, Navigate } from '@tanstack/react-router';

// /login-request/<clientId> (and any deeper path) is a pure redirector into
// /login, matching the Nuxt pages login-request/_clientId.vue and _.vue: the
// client id moves from the path into the query and every other param is carried
// through untouched. Part of the published contract - the hivesigner SDK builds
// `hive://login-request/<clientId>?...` URLs, so this must keep working.
export const Route = createFileRoute('/login-request/$')({
  component: LoginRequest,
  validateSearch: (s: Record<string, unknown>) => s as Record<string, string>,
});

function LoginRequest() {
  const { _splat } = Route.useParams();
  const search = Route.useSearch();
  // Only the FIRST path segment is the client id, as in _clientId.vue; a deeper
  // path (the _.vue catch-all) simply carries the query through.
  const pathClientId = (_splat ?? '').split('/')[0];
  const clientId = pathClientId || search.clientId || search.client_id;
  return (
    <Navigate
      replace
      to="/login"
      search={clientId ? { ...search, clientId } : search}
    />
  );
}
