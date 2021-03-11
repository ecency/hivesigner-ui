export default function ({ app }: any, inject: (key: string, value: any) => void) {
  inject('hivesigner', (window as any)._hivesigner)
}
