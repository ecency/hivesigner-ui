import { Route } from 'vue-router'

export function redirectToLoginRequest(to: Route, from: Route, next: any): void {
  const { query } = to
  const clientId = query.client_id
  delete query.client_id
  let scope = 'posting'
  if (query.scope === 'login') scope = 'login'
  if (query.scope && query.scope.includes('offline')) {
    scope = 'posting'
    query.response_type = 'code'
  }
  query.scope = scope
  next({ name: 'login-request-app', params: { clientId }, query })
}
