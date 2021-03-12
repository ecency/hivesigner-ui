import { hasAccounts } from '~/utils'
import { Context } from '@nuxt/types'

export default function ({ redirect, params, store, route }: Context): void {
  if (!store.state.auth.account.name) {
    const name = hasAccounts() ? 'login' : 'import'
    const redirectUrl = route.fullPath === '/' ? undefined : route.fullPath
    const query: Context['route']['query'] = { redirect: redirectUrl || '' }
    if (params && params.authority) {
      query.authority = params.authority
    }
    redirect(name, query)
  }
};
