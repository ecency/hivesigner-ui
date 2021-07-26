import { VuexModule as Module } from 'nuxt-property-decorator'
import { Store } from 'vuex'

export class VuexModule extends Module {
  public readonly store!: Store<any>

  constructor (...args: any) {
    super(args)
  }
}
