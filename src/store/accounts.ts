import { Module, VuexModule, VuexMutation } from 'nuxt-property-decorator'

@Module({
  stateFactory: true,
  namespaced: true,
  name: 'accounts',
})
export default class Accounts extends VuexModule {
  public accountsKeychains: Record<string, string> = {}
  // TODO: It should be first account by default
  public selectedAccount: string = ''

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
}
