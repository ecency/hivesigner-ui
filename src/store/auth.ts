import { Module, VuexAction, VuexModule, VuexMutation } from 'nuxt-property-decorator'
import { client, credentialsValid, privateKeyFrom } from '~/utils'
import { cryptoUtils, SignedTransaction } from '@hiveio/dhive'

@Module({
  stateFactory: true,
  namespaced: true,
  name: 'auth'
})
export default class Auth extends VuexModule {
  public keys: any = {}
  public account: any = {}

  public get username(): string {
    return this.account.username
  }

  public get password(): string {
    return this.keys.owner || this.keys.active || this.keys.posting || this.keys.memo
  }

  @VuexMutation
  public setUser({ result, keys }: any): void {
    this.keys = keys
    this.account = result
  }

  @VuexMutation
  public clearUser(): void {
    this.keys = {}
    this.account = {}
  }

  @VuexMutation
  public setAccount(account: any): void {
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

    this.$idleDetector.start(this.context.rootState.settings.timeout * 60 * 1000, () => {
      this.$idleDetector.stop()
      this.logout()
    })
  }

  @VuexAction
  public async logout(): Promise<void> {
    this.clearUser()
    this.$nuxt.$router.push('/')
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
  public async updateAccount(data: any): Promise<void> {
    const privateKey = privateKeyFrom(this.keys.owner || this.keys.active)
    return client.broadcast.updateAccount(data, privateKey)
  }
}
