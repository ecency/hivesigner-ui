import { hasAccounts } from '~/utils'
import { Context } from '@nuxt/types'

/**
 * Redirecting to login/import page if accounts doesn't exists
 * */
export default function ({ redirect, params, store, route }: Context): void {
  if (!store.state.auth.username) {
    const name = hasAccounts() ? '/login' : '/import'
    const redirectUrl = route.fullPath === '/' ? undefined : route.fullPath
    const query: Context['route']['query'] = { redirect: redirectUrl || [] }
    if (params?.authority) {
      query.authority = params.authority
    }
    redirect(name, query)
  }
};
