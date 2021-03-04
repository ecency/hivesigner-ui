import { VuexModule } from 'nuxt-property-decorator'
import { NuxtApp } from '@nuxt/types/app'

declare module 'nuxt-property-decorator' {

  interface VuexModule {
    $idleDetector: any
    $nuxt: NuxtApp
  }
}
