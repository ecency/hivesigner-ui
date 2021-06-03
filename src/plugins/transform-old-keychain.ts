import { Context } from '@nuxt/types'

/**
 * Transformation of old keychain local storage item into new vuex__accounts
 *
 * see accounts module and LocalStoragePersist plugin
 * */
export default function ({ store }: Context): void {
  try {
    const rawOldSnapshot = localStorage.getItem('keychain')
    if (!rawOldSnapshot) {
      return
    }
    const oldSnapshot: Record<string, string> = JSON.parse(rawOldSnapshot)
    Object.keys(oldSnapshot).forEach(username => store.commit('accounts/saveAccount', {
      username,
      key: oldSnapshot[username]
    })
    )
    localStorage.removeItem('keychain')
  } catch (_) {
    console.error('Unable to parse old keychain from localstorage')
  }
}
