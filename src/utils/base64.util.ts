import { b64uLookup } from '~/consts'

export function b64uEnc (str: string): string {
  return btoa(str).replace(/(\+|\/|=)/g, m => b64uLookup[m])
}

export function b64uDec (str: string): string {
  return atob(str.replace(/(-|_|\.)/g, m => b64uLookup[m]))
}
