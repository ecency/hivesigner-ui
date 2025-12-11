import { Transaction } from '@hiveio/dhive'
import { OPERATIONS } from '~/consts'
import { Authority } from '~/enums'

/**
 * Determines the authority required to sign a transaction.
 * After Hive HF, each authority can only sign operations for that specific authority level.
 * Returns the authority if all operations require the same authority, otherwise returns null.
 */
export function getLowestAuthorityRequired (tx: Transaction): Authority | null {
  const authorities = new Set<string>()

  tx.operations.forEach((operation) => {
    if (OPERATIONS[operation[0]] && OPERATIONS[operation[0]].authority) {
      authorities.add(OPERATIONS[operation[0]].authority)
    }
  })

  // If all operations require the same authority, return it
  if (authorities.size === 1) {
    return Array.from(authorities)[0] as Authority
  }

  // Mixed authorities - cannot be signed with a single key under current Hive rules
  // Return null to indicate this transaction requires multiple authorities
  return null
}
