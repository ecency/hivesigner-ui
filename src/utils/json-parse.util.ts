export function jsonParse(input: string, fallback?: any): any {
  try {
    return JSON.parse(input)
  } catch (err) {
    return fallback || {}
  }
}
