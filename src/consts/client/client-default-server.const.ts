import { CLIENT_OPTIONS } from './client-options.const'

export const DEFAULT_SERVER = [
  'https://api.hive.blog',
  'https://api.deathwing.me'
]
export const DEFAULT_TESTNET_SERVER = [
  'https://testnet.openhive.network'
]

// Default server list for the network this build targets.
export const ACTIVE_DEFAULT_SERVER = CLIENT_OPTIONS.addressPrefix === 'TST' ? DEFAULT_TESTNET_SERVER : DEFAULT_SERVER
