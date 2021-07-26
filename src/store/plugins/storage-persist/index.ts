import { Store } from 'vuex'
import { LocalStoragePersist } from './local-storage-persist.plugin'

export function registerStoragePersistPlugins (store: Store<any>): void {
  new LocalStoragePersist(store, ['accounts', 'auth']).activate()
}
