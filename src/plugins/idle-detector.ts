import createIdleDetector from '~/utils/idle-detector.util'

export default function ({ app }: any, inject: (key: string, value: any) => void) {
  inject('idleDetector', createIdleDetector({
    autostop: true,
  }))
}
