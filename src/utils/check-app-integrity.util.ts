export function isValidAppIntegrity (): boolean {
  return ['hivesigner.com', 'staging.hivesigner.com'].includes(window.origin)
}
