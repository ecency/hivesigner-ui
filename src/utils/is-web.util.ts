import { isChromeExtension } from '~/utils/is-chrome-extension.util'

export function isWeb(): boolean {
  return !isChromeExtension()
}
