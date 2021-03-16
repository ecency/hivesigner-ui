import { Store } from 'vuex'

declare module 'nuxt-property-decorator' {
  interface VuexModule {
    store: Store<any>
  }
}
