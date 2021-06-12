import { Context } from '@nuxt/types'
import { IdleDetector } from '../models'
import createIdleDetector from '~/utils/idle-detector.util'

export default function (_: Context, inject: (key: string, value: IdleDetector) => void) {
  inject('idleDetector', createIdleDetector())
}
