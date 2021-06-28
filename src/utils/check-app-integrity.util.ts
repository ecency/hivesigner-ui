export function isValidAppIntegrity (): boolean {
  return ['hivesigner.com', 'staging.hivesigner.com', 'testnet.hivesigner.com'].includes(window.origin)
}
