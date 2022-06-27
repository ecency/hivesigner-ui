import { Buffer } from 'buffer'
import { b64uLookup } from '~/consts'


export function b64uEnc (str: string): string {
  return Buffer.from(str, 'utf8').toString('base64').replace(/(\+|\/|=)/g, m => b64uLookup[m]);
}

export function b64uDec (str: string): string {
  return Buffer.from(str, 'base64').toString('utf8').replace(/(-|_|\.)/g, m => b64uLookup[m]);
}
