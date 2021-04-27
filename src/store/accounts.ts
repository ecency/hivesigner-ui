import { Module, VuexModule, VuexMutation } from 'nuxt-property-decorator'

@Module({
  stateFactory: true,
  namespaced: true,
  name: 'accounts',
})
export default class Accounts extends VuexModule {
  public accountsKeychains: Record<string, string> = {}
  public selectedAccount: string = ''

  @VuexMutation
  public setSelectedAccount(value: string): void {
    this.selectedAccount = value
  }
}
