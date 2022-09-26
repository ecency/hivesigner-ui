const network = process.env.BROADCAST_NETWORK || 'mainnet'

export const CLIENT_OPTIONS = {
  timeout: 3000,
  failoverThreshold: 15,
  consoleOnFailover: true,
  addressPrefix: network === 'testnet' ? 'TST' : 'STM',
  chainId: network === 'testnet' ? '4200000000000000000000000000000000000000000000000000000000000000' : 'beeab0de00000000000000000000000000000000000000000000000000000000'
}
