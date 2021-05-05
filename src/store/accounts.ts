import { Module, Vue, VuexAction, VuexModule, VuexMutation } from 'nuxt-property-decorator'
import { decrypt, jsonParse } from '~/utils'
import { DecryptionExceptions } from '~/enums'

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
    return username => this.accountsKeychains[username]?.includes('decrypted')
  }

  public get isSelectedAccountDecrypted(): boolean {
    return this.isDecrypted(this.selectedAccount)
  }

  public get getEncryptedKey(): (username: string) => string {
    return username => this.accountsKeychains[username]?.replace('decrypted', '')
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

  /**
   * @throws DecryptionExceptions.BuiltInBufferError
   * @throws DecryptionExceptions.TriplesecError
   * */
  @VuexAction({ rawError: true })
  public async getEncryptedKeys(
    { username, encryptionKey }: { username: string, encryptionKey?: string },
  ): Promise<Record<string, string>> {
    const key = this.getEncryptedKey(username)
    let error: DecryptionExceptions | null = null

    let buffer: Buffer | string | null = key
    if (this.isDecrypted(username)) {
      try {
        buffer = Buffer.from(key, 'hex').toString()
      } catch (_) {
        error = DecryptionExceptions.BuiltInBufferError
      }
    } else {
      try {
        buffer = await decrypt(key, encryptionKey)
      } catch (e) {
        error = e
      }
    }

    if (error) {
      throw error
    }

    return jsonParse(buffer.toString())
  }
}
