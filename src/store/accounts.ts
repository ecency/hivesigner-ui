import { Module, Vue, VuexModule, VuexMutation } from 'nuxt-property-decorator'

@Module({
  stateFactory: true,
  namespaced: true,
  name: 'accounts',
})
export default class Accounts extends VuexModule {
  public accountsKeychains: Record<string, string> = {}
  public selectedAccount: string = ''

  public get hasAccounts(): boolean {
    return !!this.accountsUsernamesList.length
  }

  public get accountsUsernamesList(): string[] {
    return Object.keys(this.accountsKeychains)
  }

  public get isDecrypted(): (username: string) => boolean {
    return (username: string) => this.accountsKeychains[username]?.includes('decrypted')
  }

  public get isSelectedAccountDecrypted(): boolean {
    return this.isDecrypted(this.selectedAccount)
  }

  public get getEncryptedKey(): (username: string) => string {
    return (username: string) => this.accountsKeychains[username]?.replace('decrypted', '')
  }

  public get selectedAccountEncryptedKey(): string {
    return this.getEncryptedKey(this.selectedAccount)
  }

  @VuexMutation
  public setSelectedAccount(value: string): void {
    this.selectedAccount = value
  }

  @VuexMutation
  public saveAccount({ username, key }: { username: string, key: string }): void {
    if (!this.selectedAccount) {
      this.selectedAccount = username
    }
    Vue.set(this.accountsKeychains, username, key)
  }

  @VuexMutation
  public removeAccount(username: string): void {
    Vue.delete(this.accountsKeychains, username)
  }
}
