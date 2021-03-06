import { Store } from 'vuex'
import Auth from '~/store/auth'
import { getModule } from 'nuxt-property-decorator'
import Settings from '~/store/settings'
import Ui from '~/store/ui'
import PersistentForms from '~/store/persistent-forms'

let AuthModule: Auth
let SettingsModule: Settings
let UiModule: Ui
let PersistentFormsModule: PersistentForms

const initializer = (store: Store<any>) => {
  AuthModule = getModule<Auth>(Auth, store)
  SettingsModule = getModule<Settings>(Settings, store)
  UiModule = getModule<Ui>(Ui, store)
  PersistentFormsModule = getModule<PersistentForms>(PersistentForms, store)
}
export const plugins = [initializer]

export {
  AuthModule
}
