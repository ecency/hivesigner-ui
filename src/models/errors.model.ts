export interface Errors {
  message?: string
  stack: {
    format: string
    data: Record<string, string>
  }[]
}
