import { Store } from 'vuex'
import Auth from '~/store/auth'
import { getModule } from 'nuxt-property-decorator'

let AuthModule: Auth

const initializer = (store: Store<any>) => {
  AuthModule = getModule<Auth>(Auth, store)
}
export const plugins = [initializer]

export {
  AuthModule
}
