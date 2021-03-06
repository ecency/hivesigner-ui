import { Store } from 'vuex'
import Auth from '~/store/auth'
import { getModule } from 'nuxt-property-decorator'
import Settings from '~/store/settings'
import Ui from '~/store/ui'

let AuthModule: Auth
let SettingsModule: Settings
let UiModule: Ui

const initializer = (store: Store<any>) => {
  AuthModule = getModule<Auth>(Auth, store)
  SettingsModule = getModule<Settings>(Settings, store)
  UiModule = getModule<Ui>(Ui, store)
}
export const plugins = [initializer]

export {
  AuthModule
}
