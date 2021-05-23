import { Store } from 'vuex'
import Auth from '~/store/auth'
import { getModule } from 'nuxt-property-decorator'
import Settings from '~/store/settings'
import Ui from '~/store/ui'
import PersistentForms from './persistentForms'
import Accounts from './accounts'
import { registerStoragePersistPlugins } from './plugins'

let AuthModule: Auth
let SettingsModule: Settings
let UiModule: Ui
let PersistentFormsModule: PersistentForms
let AccountsModule: Accounts

const initializer = (store: Store<{}>) => {
  AuthModule = getModule<Auth>(Auth, store)
  SettingsModule = getModule<Settings>(Settings, store)
  UiModule = getModule<Ui>(Ui, store)
  PersistentFormsModule = getModule<PersistentForms>(PersistentForms, store)
  AccountsModule = getModule<Accounts>(Accounts, store)
}
export const plugins = [initializer, registerStoragePersistPlugins]

export {
  AuthModule,
  SettingsModule,
  UiModule,
  PersistentFormsModule,
  AccountsModule,
}
