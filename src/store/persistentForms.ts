import { Module, VuexModule, VuexMutation, Vue } from 'nuxt-property-decorator'

// Rationale behind those persistent forms is exactly the same as Metamask's:
// https://github.com/MetaMask/metamask-extension/blob/develop/docs/form_persisting_architecture.md
// The only difference is in the implementation (Metamask uses localStorage), in this case we
// save form state to Vuex which is synced to the background script.
@Module({
  stateFactory: true,
  namespaced: true,
  name: 'persistentForms'
})
export default class PersistentForms extends VuexModule {
  public login: Record<string, string> = {
    username: '',
    key: ''
  }

  public import: Record<string, any> = {
    step: 1,
    username: '',
    password: '',
    key: '',
    keyConfirmation: '',
    useSameEncryptionKey: false,
    currentSelectedAccount: ''
  }

  @VuexMutation
  public saveLoginUsername (username: string): void {
    Vue.set(this.login, 'username', username)
  }

  @VuexMutation
  public saveLoginKey (key: string): void {
    Vue.set(this.login, 'key', key)
  }

  @VuexMutation
  public saveImportStep (step: number): void {
    Vue.set(this.import, 'step', step)
  }

  @VuexMutation
  public saveImportUsername (username: string): void {
    Vue.set(this.import, 'username', username)
  }

  @VuexMutation
  public saveImportPassword (password: string): void {
    Vue.set(this.import, 'password', password)
  }

  @VuexMutation
  public saveImportKey (key: string): void {
    Vue.set(this.import, 'key', key)
  }

  @VuexMutation
  public saveImportKeyConfirmation (keyConfirmation: string): void {
    Vue.set(this.import, 'keyConfirmation', keyConfirmation)
  }

  @VuexMutation
  public saveUseSameEncryptionKey (value: boolean): void {
    Vue.set(this.import, 'useSameEncryptionKey', value)
  }

  @VuexMutation
  public saveCurrentSelectedAccount (value: string): void {
    Vue.set(this.import, 'currentSelectedAccount', value)
  }
}
