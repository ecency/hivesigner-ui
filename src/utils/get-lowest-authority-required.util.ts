import { Transaction } from '@hiveio/dhive'
import { OPERATIONS } from '~/consts'
import { Authority } from '~/enums'

// TODO: Return enum of authority
export function getLowestAuthorityRequired(tx: Transaction): Authority | null {
  let authority: string | null = null
  tx.operations.forEach(operation => {
    if (OPERATIONS[operation[0]] && OPERATIONS[operation[0]].authority) {
      if (OPERATIONS[operation[0]].authority === 'owner') authority = 'owner'
      if (OPERATIONS[operation[0]].authority === 'active') authority = 'active'
      if (OPERATIONS[operation[0]].authority === 'posting' && authority !== 'active') {
        authority = 'posting'
      }
    }
  })
  return authority
}
