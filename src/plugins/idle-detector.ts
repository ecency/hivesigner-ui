import createIdleDetector from '~/utils/idle-detector.util'
import Vue from 'vue'
import { IdleDetector } from '../models'

export default function ({ app }: { app: Vue }, inject: (key: string, value: IdleDetector) => void) {
  inject('idleDetector', createIdleDetector({
    autostop: true,
  }))
}
