export function buildSearchParams(route: any): any {
  const keys = Object.keys(route.query)
  if (keys.length === 0) return ''
  const params = keys
    .filter(key => key !== 'requestId')
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(route.query[key])}`)
    .join('&')
  return `?${params}`
}
