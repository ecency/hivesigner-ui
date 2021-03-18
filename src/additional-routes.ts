import { redirectToLoginRequest } from './middleware/redirect-to-login-request'
import { Route } from 'vue-router'

export const ADDITIONAL_ROUTES = [
  {
    path: '/oauth2/authorize',
    beforeEnter: redirectToLoginRequest
  },
  {
    path: '/login-request',
    name: 'login-request',
    redirect: (to: Route) => ({
      name: 'login',
      query: {
        redirect: to.fullPath,
      },
    }),
  },
  {
    path: '/login-request/:clientId',
    name: 'login-request-app',
    redirect: (to: Route) => ({
      name: 'login',
      query: {
        redirect: to.fullPath,
      },
    }),
  },
  {
    path: '/authorize/@:username',
    redirect: (to: Route) => ({
      name: 'authorize',
      params: {
        username: to.params.username,
      },
    }),
  },
  {
    path: '/revoke/@:username',
    redirect: (to: any) => ({
      name: 'revoke',
      params: {
        username: to.params.username,
      },
    }),
  },
  {
    path: '/sign/*',
    redirect: () => ({
      name: 'sign'
    })
  }
]
