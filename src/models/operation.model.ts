export interface Operation {
  name: string
  authority: 'active' | 'posting' | 'owner'
  description: string
  schema: {
    [name: string]: {
      type: string // 'account' 'amount' 'text' TODO: move to enum
      defaultValue?: any
      maxLength?: number
    }
  }
}
