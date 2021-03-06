import { Module, VuexAction, VuexModule, VuexMutation } from 'nuxt-property-decorator'

@Module({
  stateFactory: true,
  namespaced: true,
  name: 'ui'
})
export default class Ui extends VuexModule {
  public savedPath = null

  @VuexMutation
  public setPath(path: any): void {
    this.savedPath = path
  }

  @VuexAction
  public async savePath(path: any): Promise<void> {
    this.setPath(path)
  }
}
