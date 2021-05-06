import { Context } from '@nuxt/types'
import { IVueI18n } from 'vue-i18n'

class PopupMessages {
  private i18n: IVueI18n
  private containerElement: HTMLElement = document.createElement('div')

  constructor(i18n: IVueI18n) {
    this.i18n = i18n
    this.initContainer()
  }

  public show(message: string, ms?: number): void {
    const el = PopupMessages.createElement()
    el.innerText = this.i18n.t(message).toString()
    this.containerElement.appendChild(el)
    if (ms) {
      setTimeout(() => this.hide(el), ms)
    }
  }

  private hide(el: HTMLElement): void {
    this.containerElement.removeChild(el)
  }

  private static createElement(): HTMLElement {
    const el = document.createElement('div')
    el.className = 'bg-white text-lg text-black-400 text-center p-5 rounded shadow-xl mt-5 container-sm w-full'
    return el
  }

  private initContainer(): void {
    this.containerElement.className = 'fixed bottom-0 left-0 right-0 flex flex-col justify-center mb-5 items-center p-4'
    document.body.appendChild(this.containerElement)
  }
}

export default function ({ app }: Context, inject: (key: string, value: any) => void) {
  inject('popupMessages', new PopupMessages(app.i18n))
}
