import Vue from 'vue'

declare module 'vue/types/vue' {
  interface Vue {
    readonly $hivesigner: any
    readonly $popupMessages: any
  }
}
