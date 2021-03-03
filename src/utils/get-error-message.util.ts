/** Parse error message from hived response */
import { Errors } from '~/models'

export function getErrorMessage(errors: Errors): string {
  if (errors.message) {
    return errors.message
  }

  let errorMessage = ''
  if (errors.stack[0]?.format) {
    errorMessage = errors.stack[0].format
    if (errors.stack[0]?.data) {
      const { data } = errors.stack[0]
      Object.keys(data).forEach(d => {
        errorMessage = errorMessage.split(`\${${d}}`).join(data[d])
      })
    }
  }
  return errorMessage
}
