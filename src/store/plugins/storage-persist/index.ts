import { Store } from 'vuex'
import { LocalStoragePersist } from './local-storage-persist.plugin'

export function registerStoragePersistPlugins(store: Store<any>): void {
  const localStoragePersist = new LocalStoragePersist(store, ['accounts']).activate()
}
