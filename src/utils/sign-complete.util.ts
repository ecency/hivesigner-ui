import { isChromeExtension } from '~/utils/is-chrome-extension.util'

export function signComplete(): void {
  if (!isChromeExtension()) {
    return
  }
  window.close()
}
