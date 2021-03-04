import { debounce } from 'lodash'
import { IdleDetector } from '~/models'

export default function createIdleDetector(): IdleDetector {
  let triggerIdle: any | null = null

  return {
    start(treshold, callback) {
      this.stop()

      triggerIdle = debounce(callback, treshold)

      window.addEventListener('load', triggerIdle)
      window.addEventListener('mousemove', triggerIdle)
      window.addEventListener('mousedown', triggerIdle)
      window.addEventListener('touchstart', triggerIdle)
      window.addEventListener('click', triggerIdle)
      window.addEventListener('keypress', triggerIdle)

      triggerIdle()
    },
    stop() {
      if (!triggerIdle) {
        return
      }

      window.removeEventListener('load', triggerIdle)
      window.removeEventListener('mousemove', triggerIdle)
      window.removeEventListener('mousedown', triggerIdle)
      window.removeEventListener('touchstart', triggerIdle)
      window.removeEventListener('click', triggerIdle)
      window.removeEventListener('keypress', triggerIdle)

      triggerIdle.cancel()
      triggerIdle = null
    },
  }
}
