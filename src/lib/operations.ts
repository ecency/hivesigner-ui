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

/**
 * Own properties only. `name in OPERATIONS` also answered yes for
 * `constructor`, `toString` and `__proto__`, so a path like /sign/toString
 * counted as a known operation wherever this was used to classify one.
 */
export function isKnownOperation(name: string): boolean {
  return Object.hasOwn(OPERATIONS, name);
}

/**
 * The operation name a legacy sign link uses, in the table's spelling:
 * camelCase and kebab-case to snake_case (transferToVesting ->
 * transfer_to_vesting). Shared by the request parser and the crash
 * context, so both call the same link by the same name.
 */
export function normalizeOperationName(input: string): string {
  return input
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[-\s]+/g, '_')
    .toLowerCase();
}
