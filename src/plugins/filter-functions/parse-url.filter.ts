import urlParse from 'url-parse'

export function parseURL(value: string): string {
  return urlParse(value).host
}
