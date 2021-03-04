import { Module, VuexAction, VuexModule, VuexMutation } from 'nuxt-property-decorator'
import { client, credentialsValid } from '~/utils'

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
    // router.push('/');
  }

  @VuexAction
  public async loadAccount(): Promise<void> {
    const [account] = await client.database.getAccounts([this.username])
    this.setAccount(account)
  }
}
