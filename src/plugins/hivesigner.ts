import { Context } from '@nuxt/types'

export default function ({ app }: Context, inject: (key: string, value: any) => void) {
  inject('hivesigner', (window as any)._hivesigner || {})
}
