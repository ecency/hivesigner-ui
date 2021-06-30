import { Route } from 'vue-router'

export const ADDITIONAL_ROUTES = [
  {
    path: '/sign/*',
    beforeEnter (_: Route, __: Route, next: any): void {
      next({
        name: 'sign'
      })
    }
  }
]
