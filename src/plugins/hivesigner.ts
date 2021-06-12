import { Context } from '@nuxt/types'

export default function (_: Context, inject: (key: string, value: any) => void) {
  inject('hivesigner', (window as any)._hivesigner || {})
}
