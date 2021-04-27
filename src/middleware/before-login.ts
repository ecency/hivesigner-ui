import { Context } from '@nuxt/types'

export default function ({ redirect, query, store }: Context): void {
  if (!store.getters['accounts/hasAccounts']) {
    redirect('/import', query)
  }
}
