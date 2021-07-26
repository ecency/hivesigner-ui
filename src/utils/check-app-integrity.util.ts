export function isValidAppIntegrity (): boolean {
  return [
    'https://hivesigner.com',
    'https://staging.hivesigner.com',
    'https://testnet.hivesigner.com',
    ...(process.env.NODE_ENV !== 'production' ? ['http://localhost:3000'] : [])
  ].includes(window.origin)
}
