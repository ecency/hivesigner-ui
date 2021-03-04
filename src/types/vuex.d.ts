import { VuexModule } from 'nuxt-property-decorator'

declare module 'nuxt-property-decorator' {
  interface VuexModule {
    $idleDetector: any
  }
}
