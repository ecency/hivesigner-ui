import { Context } from '@nuxt/types'
import { isValidAppIntegrity } from '../utils'

export default function ({ app }: Context) {
  if (!isValidAppIntegrity()) {
    app.$popupMessages.show('common.invalid_integrity', -1, 'error')
  }
}
