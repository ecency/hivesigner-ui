import { Context } from '@nuxt/types'

export default function ({ redirect, query, store }: Context): void {
  let redirectParam = query.redirect as string || ''

  if (redirectParam.startsWith('/login-request')) {
    redirectParam = redirectParam.replace('/login-request/', '')
    const [appName, params] = redirectParam.split('?')
    const parsedParams = params
      .split('&')
      .reduce<Record<string, string>>((acc, param) => {
        const [key, value] = param.split('=')
        return {
          ...acc,
          [key]: value
        }
      }, {})
    delete query.redirect
    query = {
      ...query,
      ...parsedParams,
      clientId: appName
    }
    if (store.getters['accounts/hasAccounts']) {
      redirect('/login', query)
    }
  }

  if (!store.getters['accounts/hasAccounts']) {
    redirect('/import', query)
  }
}
