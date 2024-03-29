import { Module, Vue, VuexAction, VuexModule, VuexMutation } from 'nuxt-property-decorator'
import { PrivateKey } from '@hiveio/dhive'
import Bugsnag from '../plugins/bugsnag'
import { AuthModule } from './index'
import { CLIENT_OPTIONS } from '~/consts'
import { decrypt, getUserKeysMap, isKey, jsonParse, privateKeyFrom } from '~/utils'
import { DecryptionExceptions } from '~/enums'
import { AccountKeychain } from '~/models'

@Module({
  stateFactory: true,
  namespaced: true,
  name: 'accounts'
})
export default class Accounts extends VuexModule {
  public accountsKeychains: AccountKeychain = {}
  public selectedAccount: string = ''

  public get hasAccounts (): boolean {
    return !!this.accountsUsernamesList.length
  }

  public get hasEncryptedAccount (): boolean {
    return !!this.accountsUsernamesList.find(account => !this.isDecrypted(account))
  }

  public get hasMultipleEncryptedAccounts (): boolean {
    return this.accountsUsernamesList.filter(account => !this.isDecrypted(account)).length > 1
  }

  public get accountsUsernamesList (): string[] {
    return Object.keys(this.accountsKeychains)
  }

  public get encryptedAccountsList (): string[] {
    return this.accountsUsernamesList.filter(account => !this.isDecrypted(account))
  }

  public get isDecrypted (): (username: string) => boolean {
    return username => this.accountsKeychains[username]?.password.includes('decrypted')
  }

  public get isSelectedAccountDecrypted (): boolean {
    return this.isDecrypted(this.selectedAccount)
  }

  public get getEncryptedKey (): (username: string) => string {
    return username => this.accountsKeychains[username]?.password.replace('decrypted', '')
  }

  public get selectedAccountEncryptedKey (): string {
    return this.getEncryptedKey(this.selectedAccount)
  }

  public get hasAuthorityPrivateKey (): (username: string, authority: string) => boolean {
    return (username, authority) => {
      return !!this.accountsKeychains[username][authority]
    }
  }

  public get isValidKeysForAuthority (): (authority: string, keys: Record<string, string>) => boolean {
    return (authority, keys) =>
      !!((authority === 'owner' && keys.owner) ||
      (authority === 'active' && (keys.owner || keys.active)) ||
      (authority === 'posting' && (keys.owner || keys.active || keys.posting)) ||
      keys[authority])
  }

  @VuexMutation
  public setSelectedAccount (value: string): void {
    this.selectedAccount = value
  }

  @VuexMutation
  public saveAccount ({ username, keys }: { username: string, keys: Record<string, string> }): void {
    if (!this.selectedAccount) {
      this.selectedAccount = username
    }
    Vue.set(this.accountsKeychains, username, keys)
  }

  @VuexMutation
  public saveAccountKeys ({ username, keys }: { username: string, keys: Record<string, string> }): void {
    if (this.accountsKeychains[username]) {
      Vue.set(this.accountsKeychains, username, {
        ...keys,
        password: this.accountsKeychains[username].password
      })
    }
  }

  @VuexMutation
  public remove (username: string): void {
    Vue.delete(this.accountsKeychains, username)
    if (this.selectedAccount === username) {
      const accounts = Object.keys(this.accountsKeychains)
      this.selectedAccount = accounts.length ? accounts[0] : ''
    }
  }

  @VuexAction
  public async removeAccount (username: string): Promise<void> {
    this.remove(username)
    if (AuthModule.account?.name === username) {
      await AuthModule.logout()
    }
  }

  /**
   * @throws DecryptionExceptions.BuiltInBufferError
   * @throws DecryptionExceptions.TriplesecError
   * */
  @VuexAction({ rawError: true })
  public async getEncryptedKeys (
    { username, encryptionKey }: { username: string, encryptionKey?: string }
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
        Bugsnag.notify(e)
      }
    }

    if (error) {
      throw error
    }

    return jsonParse(buffer.toString())
  }

  @VuexAction({ rawError: true })
  public async getAuthoritiesKeys ({ username, password }: { username: string, password: string }): Promise<Record<string, string | null>> {
    const keys: Record<string, string> = {}
    const keysMap = await getUserKeysMap(username)

    if (isKey(username, password)) {
      const type = keysMap[privateKeyFrom(password).createPublic(CLIENT_OPTIONS.addressPrefix).toString()]
      keys[type] = password
      return keys
    }

    keys.owner = PrivateKey.fromLogin(username, password, 'owner').toString()
    keys.active = PrivateKey.fromLogin(username, password, 'active').toString()
    keys.posting = PrivateKey.fromLogin(username, password, 'posting').toString()

    const memoKey = PrivateKey.fromLogin(username, password, 'memo')

    if (keysMap[memoKey.createPublic(CLIENT_OPTIONS.addressPrefix).toString()] === 'memo') {
      keys.memo = memoKey.toString()
    }

    return keys
  }

  @VuexAction({ rawError: true })
  public async isValidCredentials ({ username, password }: { username: string, password: string }): Promise<boolean> {
    const keysMap = await getUserKeysMap(username)
    const key: PrivateKey = isKey(username, password)
      ? privateKeyFrom(password)
      : PrivateKey.fromLogin(username, password, 'active')

    return !!keysMap[key.createPublic(CLIENT_OPTIONS.addressPrefix).toString()]
  }

  @VuexAction({ rawError: true })
  public async isValidEncryptionKey ({ username, password }: { username: string, password: string }): Promise<boolean> {
    try {
      await this.getEncryptedKeys({ username, encryptionKey: password })
      return true
    } catch (e) {
      return false
    }
  }
}
