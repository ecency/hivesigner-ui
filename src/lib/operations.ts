// The operation schema table, reused verbatim from the Nuxt app
// (src/assets/data/operations.json). It drives which fields a legacy /sign URL
// keeps, their defaults and formatting, and the authority each operation needs.
import operations from '@/data/operations.json';

export type FieldType =
  | 'account'
  | 'amount'
  | 'string'
  | 'int'
  | 'bool'
  | 'object'
  | 'array'
  | 'time'
  | 'json';

export type HiveAuthority = 'posting' | 'active' | 'owner';

export interface OperationField {
  type: FieldType;
  defaultValue?: string | number | boolean;
  maxLength?: number;
}

export interface OperationSchema {
  name: string;
  authority: HiveAuthority;
  description?: string;
  schema: Record<string, OperationField>;
}

export const OPERATIONS = operations as unknown as Record<
  string,
  OperationSchema
>;

export function isKnownOperation(name: string): boolean {
  return name in OPERATIONS;
}
