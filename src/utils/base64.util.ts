import { Base64 } from 'js-base64'
import { b64uLookup } from '~/consts'

export function b64uEnc (str: string): string {
  return Base64.atob(str).replace(/(\+|\/|=)/g, m => b64uLookup[m])
}

export function b64uDec (str: string): string {
  return Base64.btoa(str).replace(/(-|_|\.)/g, m => b64uLookup[m])
}
