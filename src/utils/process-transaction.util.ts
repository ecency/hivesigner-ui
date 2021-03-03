import { processValue } from '~/utils/process-value.util'
import { OPERATIONS } from '~/consts'

export function processTransaction(transaction: any, config: any): any {
  const processed = { ...transaction }
  processed.tx.operations = transaction.tx.operations.map(([name, payload]: any) => {
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
