import { Module, VuexAction, VuexMutation } from 'nuxt-property-decorator'
import Bugsnag from '../plugins/bugsnag'
import { client } from '~/utils'
import { DEFAULT_SERVER, SETTINGS_KEY } from '~/consts'
import { VuexModule } from '~/models'

// Node addresses that used to be the default but are no longer served.
// Saved settings still pointing at one of them fall back to the current default.
const RETIRED_ADDRESSES = ['https://rpc.ecency.com']

@Module({
  stateFactory: true,
  namespaced: true,
  name: 'settings'
})
export default class Settings extends VuexModule {
  public properties: any = {}
  public steemAddressPrefix: string = ''
  public chainId: string = ''
  public language: string = 'en'
  public timeout: string = '20'
  public theme: string = 'white'
  public address: string = DEFAULT_SERVER[0]

  @VuexMutation
  public saveProperties (properties: any): void {
    this.properties = properties
  }

  @VuexMutation
  public saveConfig (config: any): void {
    this.steemAddressPrefix = config.HIVE_ADDRESS_PREFIX
    this.chainId = config.HIVE_CHAIN_ID
  }

  @VuexMutation
  public setSettings (settings: any): void {
    if (settings.language) {
      this.language = settings.language
    }
    if (settings.timeout) {
      this.timeout = settings.timeout
    }
    if (settings.theme) {
      this.theme = settings.theme
    }
    if (settings.address) {
      this.address = settings.address
    }
  }

  @VuexAction
  public async getDynamicGlobalProperties (): Promise<void> {
    const result = await client.database.call('get_dynamic_global_properties', [])
    this.saveProperties(result)
  }

  @VuexAction
  public async getConfig (): Promise<void> {
    const config = await client.database.call('get_config', [])
    this.saveConfig(config)
  }

  @VuexAction
  public async loadSettings (): Promise<void> {
    const settingsContent = localStorage.getItem(SETTINGS_KEY)
    if (!settingsContent) {
      return await this.getConfig()
    }

    try {
      const settings = JSON.parse(settingsContent)
      if (!settings.address || RETIRED_ADDRESSES.includes(settings.address)) {
        delete settings.address
      } else {
        (client as any).updateClient(settings.address)
      }
      await this.getConfig()

      this.setSettings(settings)
    } catch (err) {
      console.error('Couldn`t load settings', err)
      Bugsnag.notify(err)
    }
  }

  @VuexAction({ rawError: true })
  public async saveSettings (settings: any): Promise<void> {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
    } catch (err) {
      console.error("Couldn't save settings", err)
      Bugsnag.notify(err)
    }

    await this.loadSettings()
  }
}
