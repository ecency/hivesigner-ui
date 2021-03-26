import { hasAccounts } from '~/utils'
import { Context } from '@nuxt/types'

export default function ({ redirect, query }: Context): void {
  if (!hasAccounts()) {
    redirect('/import', query)
  }
}
