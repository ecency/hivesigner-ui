export function pretty (value: string): string {
  let json
  try {
    json = JSON.stringify(JSON.parse(value), null, 2)
  } catch (e) {
    json = value
  }
  return json
}
