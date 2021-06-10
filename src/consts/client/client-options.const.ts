const network = process.env.BROADCAST_NETWORK || 'mainnet'

export const CLIENT_OPTIONS = {
  timeout: 3000,
  failoverThreshold: 15,
  consoleOnFailover: true,
  addressPrefix: network === 'testnet' ? 'TST' : 'STM',
  chainId: network === 'testnet' ? '18dcf0a285365fc58b71f18b3d3fec954aa0c141c44e4e5cb4cf777b9eab274e' : 'beeab0de00000000000000000000000000000000000000000000000000000000'
}
