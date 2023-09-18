export function isValidAppIntegrity (): boolean {
  return [
    'https://hivesigner.com',
    'https://staging.hivesigner.com',
    'https://testnet.hivesigner.com'
  ].includes(window.origin) || process.env.NODE_ENV !== 'production'
}
