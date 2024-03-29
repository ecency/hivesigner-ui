import { Context } from '@nuxt/types'
import { IVueI18n } from 'vue-i18n'

class PopupMessages {
  private i18n: IVueI18n
  private containerElement: HTMLElement = document.createElement('div')

  constructor (i18n: IVueI18n) {
    this.i18n = i18n
    this.initContainer()
  }

  public show (message: string, ms = 300, type = 'info'): void {
    const el = PopupMessages.createElement()
    el.innerHTML = this.i18n.t(message).toString()
    if (type === 'error') {
      el.classList.add('bg-primary')
      el.classList.add('text-white')
    }
    this.containerElement.appendChild(el)
    this.containerElement.classList.remove('hidden')
    this.containerElement.classList.add('flex')
    setTimeout(() => {
      el.classList.remove('translate-y-full')
      el.classList.remove('opacity-0')
    }, 300)
    setTimeout(() => this.hide(el, ms), ms)
  }

  private hide (el: HTMLElement, ms = 300): void {
    el.classList.add('translate-y-full')
    el.classList.add('opacity-0')
    if (ms > 0) {
      setTimeout(() => {
        this.containerElement.removeChild(el)
        if (this.containerElement.children.length === 0) {
          this.containerElement.classList.add('hidden')
          this.containerElement.classList.remove('flex')
        }
      }, 300)
    }
  }

  private static createElement (): HTMLElement {
    const el = document.createElement('div')
    el.className = 'bg-white text-lg text-black-400 text-center p-5 rounded shadow-xl mt-5' +
      ' container-sm w-full transform translate-y-full opacity-0 duration-300'
    return el
  }

  private initContainer (): void {
    this.containerElement.className = 'fixed bottom-0 left-0 right-0 hidden flex-col' +
      ' justify-center mb-5 items-center p-4 z-20'
    document.body.appendChild(this.containerElement)
  }
}

export default function ({ app }: Context, inject: (key: string, value: any) => void) {
  inject('popupMessages', new PopupMessages(app.i18n))
}
