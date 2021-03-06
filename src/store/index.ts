import { Store } from 'vuex'
import Auth from '~/store/auth'
import { getModule } from 'nuxt-property-decorator'
import Settings from '~/store/settings'

let AuthModule: Auth
let SettingsModule: Settings

const initializer = (store: Store<any>) => {
  AuthModule = getModule<Auth>(Auth, store)
  SettingsModule = getModule<Settings>(Settings, store)
}
export const plugins = [initializer]

export {
  AuthModule
}
