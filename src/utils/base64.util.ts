import { B64u_LOOKUP } from '~/consts'

export function b64uEnc(str: string): string {
  return btoa(str).replace(/(\+|\/|=)/g, m => B64u_LOOKUP[m])
}

export function b64uDec(str: string): string {
  return atob(str.replace(/(-|_|\.)/g, m => B64u_LOOKUP[m]))
}
