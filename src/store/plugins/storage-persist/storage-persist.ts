import { Store, MutationPayload } from 'vuex'

export abstract class StoragePersist<T extends Record<any, any>> {
  protected store: Store<T>
  protected forModules: string[] = []

  constructor (store: Store<T>, forModules: string[] = []) {
    this.store = store
    this.forModules = forModules
    this.onStoreInit()
  }

  public activate (): void {
    this.store.subscribe((mutation, state) => this.onMutationCall(mutation, state))
  }

  protected abstract onMutationCall(mutation: MutationPayload, state: T): void

  protected abstract onStoreInit(): void
}
