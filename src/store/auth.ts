import { Module, VuexAction, VuexModule, VuexMutation } from 'nuxt-property-decorator'

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
  public setUser({result, keys}: any): void {
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
  public async login({username, keys}: any): Promise<any> {
    const key = keys.owner || keys.active || keys.posting || keys.memo
    const valid = await credentialsValid(username, key)

    if (!valid) {
      throw new Error('Invalid credentials')
    }

    const result = await client.database.getAccounts([username])
    commit('login', {result: result[0], keys})

    idleDetector.start(rootState.settings.timeout * 60 * 1000, () => {
      idleDetector.stop()
      dispatch('logout')
    })
  }
}
