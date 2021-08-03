import { MutationPayload, Store } from 'vuex'
import Bugsnag from '../../../plugins/bugsnag'
import { StoragePersist } from './storage-persist'

export class LocalStoragePersist<T extends Record<any, any>> extends StoragePersist<T> {
  constructor (store: Store<T>, forModules: string[] = []) {
    super(store, forModules)
  }

  protected onStoreInit (): void {
    this.forModules.forEach((module) => {
      try {
        const rawSnapshot = localStorage.getItem(`vuex__${module}`)
        if (!rawSnapshot) {
          return
        }
        const snapshot = JSON.parse(rawSnapshot)
        this.store.replaceState({
          ...this.store.state,
          [module]: snapshot
        })
      } catch (e) {
        console.error(`Failed to load persistent data from localstorage for ${module} Vuex module`)
        Bugsnag.notify(e)
      }
    })
  }

  protected onMutationCall (mutation: MutationPayload, state: T) {
    const mutatedModule = this.forModules.find(module => mutation.type.includes(module))
    if (mutatedModule) {
      const moduleStateSnapshot = JSON.stringify(state[mutatedModule])
      localStorage.setItem(`vuex__${mutatedModule}`, moduleStateSnapshot)
    }
  }
}
