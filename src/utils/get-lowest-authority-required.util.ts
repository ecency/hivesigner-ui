import { Transaction } from '@hiveio/dhive'
import { OPERATIONS } from '~/consts'
import { Authority } from '~/enums'

/**
 * For custom_json, the required authority depends on the operation data:
 * - If required_auths is non-empty, active authority is needed
 * - If required_posting_auths is non-empty, posting authority is needed
 */
function getCustomJsonAuthority (operationData: any): Authority {
  if (operationData.required_auths && operationData.required_auths.length > 0) {
    return Authority.Active
  }
  return Authority.Posting
}

/**
 * Determines the authority required to sign a transaction.
 * After Hive HF, each authority can only sign operations for that specific authority level.
 * Returns the authority if all operations require the same authority, otherwise returns null.
 */
export function getLowestAuthorityRequired (tx?: Transaction | null): Authority | null {
  if (!tx || !Array.isArray(tx.operations)) {
    return null
  }
  const authorities = new Set<string>()

  tx.operations.forEach((operation) => {
    const opType = operation[0]
    const opData = operation[1]

    if (opType === 'custom_json') {
      authorities.add(getCustomJsonAuthority(opData))
    } else if (OPERATIONS[opType] && OPERATIONS[opType].authority) {
      authorities.add(OPERATIONS[opType].authority)
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
