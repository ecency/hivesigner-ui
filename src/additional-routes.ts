import { Route } from 'vue-router'

export const ADDITIONAL_ROUTES = [
  {
    path: '/login-request',
    name: 'login-request',
    beforeEnter(to: Route, from: Route, next: any): void {
      next({
        name: 'login',
        query: to.fullPath,
      });
    },
  },
  {
    path: '/login-request/:clientId',
    name: 'login-request-app',
    beforeEnter(to: Route, from: Route, next: any): void {
      next({
        name: 'login',
        query: to.fullPath,
      });
    },
  },
  {
    path: '/authorize/@:username',
    beforeEnter(to: Route, from: Route, next: any): void {
      next({
        name: 'authorize',
        query: to.params.username,
      });
    },
  },
  {
    path: '/revoke/@:username',
    beforeEnter(to: Route, from: Route, next: any): void {
      next({
        name: 'revoke',
        query: to.params.username,
      });
    },
  },
  {
    path: '/sign/*',
    beforeEnter(to: Route, from: Route, next: any): void {
      next({
        name: 'sign',
      });
    },
  }
]
