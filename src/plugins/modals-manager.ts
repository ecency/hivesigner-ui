import { Context } from '@nuxt/types'

class ModalsManager {
  private stack: number[] = []
  private uniqueId = 0

  private get shouldBodyBeenBlocked (): boolean {
    return !!this.stack.length
  }

  public get nextId (): number {
    this.uniqueId++
    return this.uniqueId
  }

  public expose (): void {
    this.stack.push(1)
    this.blockBodyScroll()
  }

  public release (): void {
    this.stack.pop()

    if (!this.shouldBodyBeenBlocked) {
      this.unblockBodyScroll()
    }
  }

  private blockBodyScroll (): void {
    document.body.classList.add('overflow-hidden')
  }

  private unblockBodyScroll (): void {
    document.body.classList.remove('overflow-hidden')
  }
}

export default function (_: Context, inject: (key: string, value: any) => void) {
  inject('modalsManager', new ModalsManager())
}
