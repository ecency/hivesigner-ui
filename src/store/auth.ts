import { Module, VuexAction, VuexModule, VuexMutation } from 'nuxt-property-decorator'
import { cryptoUtils, SignedTransaction } from '@hiveio/dhive'
import { client, credentialsValid, privateKeyFrom } from '~/utils'
import { Account } from '~/models'

@Module({
  stateFactory: true,
  namespaced: true,
  name: 'auth'
})
export default class Auth extends VuexModule {
  public keys: Record<string, string> = {}
  public account: Account | undefined

  public get username(): string | undefined {
    return this.account?.name
  }

  public get password(): string {
    return this.keys.owner || this.keys.active || this.keys.posting || this.keys.memo
  }

  @VuexMutation
  public setUser({ result, keys }: { result: Account, keys: Record<string, string> }): void {
    this.keys = keys
    this.account = result
  }

  @VuexMutation
  public clearUser(): void {
    this.keys = {}
    this.account = undefined
  }

  @VuexMutation
  public setAccount(account: Account): void {
    this.account = account
  }

  @VuexAction
  public async login({ username, keys }: any): Promise<any> {
    const key = keys.owner || keys.active || keys.posting || keys.memo
    const valid = await credentialsValid(username, key)

    if (!valid) {
      throw new Error('Invalid credentials')
    }

    const result = await client.database.getAccounts([username])

    this.setUser({ result: result[0], keys })

    this.store.app.$idleDetector.start(this.context.rootState.settings.timeout * 60 * 1000, () => {
      this.store.app.$idleDetector.stop()
      this.logout()
    })
  }

  @VuexAction
  public async logout(): Promise<void> {
    this.clearUser()
    this.store.app.$router.push('/')
  }

  @VuexAction
  public async loadAccount(): Promise<void> {
    const [account] = await client.database.getAccounts([this.username])
    this.setAccount(account)
  }

  @VuexAction
  public async sign({ tx, authority }: any): Promise<SignedTransaction> {
    const { chainId } = this.context.rootState.settings
    const privateKey =
      authority && this.keys[authority]
        ? privateKeyFrom(this.keys[authority])
        : privateKeyFrom(this.password)
    return cryptoUtils.signTransaction(tx, [privateKey], Buffer.from(chainId, 'hex'))
  }

  @VuexAction
  public async signMessage({ message, authority }: any): Promise<any> {
    const timestamp = parseInt((new Date().getTime() / 1000) + '', 10)
    const messageObj: any = { signed_message: message, authors: [this.username], timestamp }
    const hash = cryptoUtils.sha256(JSON.stringify(messageObj))
    const privateKey =
      authority && this.keys[authority]
        ? privateKeyFrom(this.keys[authority])
        : privateKeyFrom(this.password)
    const signature = privateKey.sign(hash).toString()
    messageObj.signatures = [signature]
    return messageObj
  }

  @VuexAction
  public async broadcast(tx: any): Promise<void> {
    client.broadcast.send(tx)
  }

  @VuexAction
  public async updateAccount(data: any): Promise<any> {
    const privateKey = privateKeyFrom(this.keys.owner || this.keys.active)
    return client.broadcast.updateAccount(data, privateKey)
  }
}
