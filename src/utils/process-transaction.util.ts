import { DecodeResult } from 'hive-uri'
import { processValue } from '~/utils/process-value.util'
import { OPERATIONS } from '~/consts'

export function processTransaction (transaction: DecodeResult, config: Record<string, number>): DecodeResult {
  const processed = { ...transaction }

  // hive-uri types `operations` loosely, so the destructured elements were
  // implicitly any and noImplicitAny failed the compile.
  processed.tx.operations = transaction.tx.operations.map((
    [name, payload]: [string, Record<string, string | boolean>]
  ) => {
    const processedPayload = Object.keys(OPERATIONS[name].schema).reduce(
      (acc, key) => ({
        ...acc,
        [key]: processValue(OPERATIONS[name].schema, key, payload[key], config)
      }),
      {}
    )
    return [name, processedPayload]
  })
  return processed
}
