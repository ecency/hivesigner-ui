import { Vue } from 'nuxt-property-decorator'


declare module 'nuxt-property-decorator' {

  interface Vue {
    $hivesigner: any
  }
}
