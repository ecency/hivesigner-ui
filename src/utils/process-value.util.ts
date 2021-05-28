import { Operation } from '../models'

export function processValue(schema: Operation['schema'], key: string, value: string | boolean, { vestsToSP }: Record<string, number>): string | number | boolean {
  const { type, defaultValue, maxLength } = schema[key]
  const realValue = !value && typeof defaultValue !== 'undefined' ? defaultValue : value
  switch (type) {
    case 'amount':
      if (realValue.indexOf('VESTS') !== -1) return `${parseFloat(realValue).toFixed(6)} VESTS`
      if (realValue.indexOf('HP') !== -1)
        return `${(parseFloat(realValue) / vestsToSP).toFixed(6)} VESTS`
      if (realValue.indexOf('HIVE') !== -1) return `${parseFloat(realValue).toFixed(3)} HIVE`
      if (realValue.indexOf('HBD') !== -1) return `${parseFloat(realValue).toFixed(3)} HBD`
      return realValue
    case 'int':
      return parseInt(realValue, 10)
    case 'bool':
      if (value === 'false' || value === false) return false
      return realValue
    case 'string':
      if (maxLength) return realValue.substring(0, Math.min(realValue.length, maxLength - 1))
      return realValue
    default:
      return realValue
  }
}
