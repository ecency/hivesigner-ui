import { decode, DecodeResult, encodeOps } from 'hive-uri'
import qs from 'query-string'
import urlParse from 'url-parse'
import { snakeCase } from 'lodash'
import { OPERATIONS } from '~/consts'

export function legacyToHiveUri(uri: string): DecodeResult | null {
  let parsed: DecodeResult | null = null
  try {
    const url = urlParse(uri)
    const opName = snakeCase(url.pathname.slice(1))
    // TODO: Fix url parse
    //       It was string but now is object
    const queryParams = qs.parse((url.query as any).slice(1))

    if (!OPERATIONS[opName]) {
      return null
    }

    const opParams = Object.keys(OPERATIONS[opName].schema).reduce((acc, b) => {
      if (!queryParams[b]) {
        return acc
      }
      let value = queryParams[b]
      if (OPERATIONS[opName].schema[b] && OPERATIONS[opName].schema[b].type) {
        if (['array', 'object'].includes(OPERATIONS[opName].schema[b].type)) {
          try {
            value = JSON.parse(value as string)
          } catch {
            // TODO: wrong type of url-parse
            value = value || {} as any
          }
        }
        if (OPERATIONS[opName].schema[b].type === 'bool') {
          // TODO: wrong type of url-parse
          value = ['true', true, 1, '1'].includes(value as any) as any
        }
      }
      return { ...acc, [b]: value }
    }, {})
    const params = { callback: queryParams.redirect_uri }
    // TODO: wrong type of encode ops
    const b64Uri = encodeOps([[opName, opParams]] as any, params as any)
    parsed = decode(b64Uri)
  } catch (err) {
    console.log('Failed to parse legacy uri', err)
  }
  return parsed
}
