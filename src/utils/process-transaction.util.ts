import { processValue } from '~/utils/process-value.util'
import { OPERATIONS } from '~/consts'
import { DecodeResult } from 'hive-uri'

export function processTransaction(transaction: DecodeResult, config: Record<string, number>): DecodeResult {
  const processed = { ...transaction }

  processed.tx.operations = transaction.tx.operations.map(([name, payload]) => {
    const processedPayload = Object.keys(OPERATIONS[name].schema).reduce(
      (acc, key) => ({
        ...acc,
        [key]: processValue(OPERATIONS[name].schema, key, payload[key], config),
      }),
      {},
    )
    return [name, processedPayload]
  })
  return processed
}
