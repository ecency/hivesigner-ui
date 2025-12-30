import { Authority } from '~/enums'

export interface SignedMessagePayload {
  signed_message: Record<string, unknown> | string
  authors: string[]
  timestamp: number
  signatures?: string[]
  authority?: Authority
}
