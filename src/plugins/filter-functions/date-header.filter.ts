export function dateHeader(value: string | number): string {
  return new Date(value).toLocaleString()
}
