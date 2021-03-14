import { hasAccounts } from '~/utils'
import { Context } from '@nuxt/types'

export default function ({ redirect, route }: Context): void {
  if (!hasAccounts()) {
    const redirectParam = route.query.redirect === '/' ? undefined : route.query.redirect
    const authority = route.query.authority || undefined
    // @ts-ignore
    redirect('/import', { authority, redirect: redirectParam })
  }
}
