import { isChromeExtension } from '~/utils/is-chrome-extension.util'

export function signComplete(requestId: string, err: Error | string | null, result: any): void {
  if (!isChromeExtension()) {
    return
  }
  window.close()
}
