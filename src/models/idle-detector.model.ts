export interface IdleDetector {
  start: (treshold: number, callback: () => void) => void
  stop: () => void
}
