import { describe, expect, it } from 'vitest';
import { encodeOp, encodeOps } from './hive-uri';
import { requiredAuthority } from './operation-summary';
import { type FieldType, OPERATIONS } from './operations';
import { parseSignRequest } from './parse-sign-request';

// EVERY operation in the schema, through every entry point, with the type of
// every processed field checked against what the chain serializes. A defect in
// one type (arrays, until the proposal_ids report) is caught for every
// operation rather than for the one somebody happened to try.

const VALID_TYPES: FieldType[] = [
  'account',
  'amount',
  'string',
  'int',
  'bool',
  'object',
  'array',
  'time',
  'json',
];

/** A plausible text value for a field, as a URL or the /signs form would carry it. */
function sample(op: string, field: string, type: FieldType): string {
  switch (type) {
    case 'account':
      return 'alice';
    case 'amount':
      if (field.includes('vest') || field === 'delegation') return '1 VESTS';
      if (field.includes('hbd') || field === 'daily_pay') return '1 HBD';
      return '1 HIVE';
    case 'string':
      return field.includes('key')
        ? 'STM1111111111111111111111111111111114T1Anm'
        : 'text';
    case 'int':
      return '7';
    case 'bool':
      return 'true';
    case 'object':
      return field === 'exchange_rate'
        ? '{"base":"1.000 HIVE","quote":"1.000 HBD"}'
        : '{"weight_threshold":1,"account_auths":[],"key_auths":[]}';
    case 'array':
      // The failure mode from the report: a bare scalar where a list belongs.
      return op.includes('proposal') && field === 'proposal_ids' ? '379' : '[]';
    case 'time':
      return '2030-01-01T00:00:00';
    case 'json':
      return '{"k":"v"}';
  }
}

function expectTyped(
  op: string,
  field: string,
  type: FieldType,
  value: unknown,
) {
  const where = `${op}.${field} (${type})`;
  switch (type) {
    case 'array':
      expect(Array.isArray(value), where).toBe(true);
      return;
    case 'object':
      expect(
        typeof value === 'object' && value !== null && !Array.isArray(value),
        where,
      ).toBe(true);
      return;
    case 'int':
      expect(typeof value === 'number' && Number.isFinite(value), where).toBe(
        true,
      );
      return;
    case 'bool':
      expect(typeof value, where).toBe('boolean');
      return;
    case 'amount':
      expect(String(value), where).toMatch(/^\d+\.\d{3,6} (HIVE|HBD|VESTS)$/);
      return;
    case 'json':
      expect(typeof value, where).toBe('string');
      if (value !== '')
        expect(() => JSON.parse(value as string), where).not.toThrow();
      return;
    default:
      expect(typeof value, where).toBe('string');
  }
}

describe('operation schema', () => {
  it('names an authority and known field types for every operation', () => {
    for (const [op, spec] of Object.entries(OPERATIONS)) {
      expect(['posting', 'active', 'owner'], op).toContain(spec.authority);
      expect(spec.name, op).toBeTruthy();
      for (const [field, f] of Object.entries(spec.schema)) {
        expect(VALID_TYPES, `${op}.${field}`).toContain(f.type);
      }
    }
  });
});

describe('every operation, through the legacy URL', () => {
  for (const [op, spec] of Object.entries(OPERATIONS)) {
    it(`${op}: every field comes out with the type the chain serializes`, () => {
      const query: Record<string, string> = {};
      for (const [field, f] of Object.entries(spec.schema)) {
        query[field] = sample(op, field, f.type);
      }
      const req = parseSignRequest(op, query, 1);
      expect(req, `${op} did not parse`).not.toBeNull();
      const [name, payload] = req?.operations[0] as [
        string,
        Record<string, unknown>,
      ];
      expect(name).toBe(op);
      for (const [field, f] of Object.entries(spec.schema)) {
        expectTyped(op, field, f.type, payload[field]);
      }
      // No field the schema does not know reaches the payload.
      for (const key of Object.keys(payload))
        expect(spec.schema, `${op}.${key}`).toHaveProperty(key);
    });
  }
});

describe('every operation, through an encoded op (the /signs builder handoff)', () => {
  for (const [op, spec] of Object.entries(OPERATIONS)) {
    it(`${op}: same result as the legacy URL`, () => {
      const raw: Record<string, unknown> = {};
      for (const [field, f] of Object.entries(spec.schema)) {
        raw[field] = sample(op, field, f.type);
      }
      const uri = encodeOp([op, raw]);
      const viaOp = parseSignRequest(uri.replace('hive://sign/', ''), {}, 1);
      const viaLegacy = parseSignRequest(op, raw as Record<string, string>, 1);
      expect(viaOp, `${op} did not parse`).not.toBeNull();
      expect(viaOp?.operations[0][1]).toEqual(viaLegacy?.operations[0][1]);
    });
  }
});

describe('every operation, with only its defaults', () => {
  for (const [op, spec] of Object.entries(OPERATIONS)) {
    const required = Object.entries(spec.schema).filter(
      ([, f]) => f.defaultValue === undefined,
    );
    it(`${op}: defaults apply and ${required.length} required field(s) stay absent, never invented`, () => {
      const req = parseSignRequest(op, {}, 1);
      // An op whose required fields are all present-by-default parses; one
      // with a required structured field may not. Either way nothing may be
      // INVENTED: an absent object must not become {} (the owner-key
      // escalation), an absent list must not become [] unless the schema says.
      if (!req) return;
      const payload = req.operations[0][1] as Record<string, unknown>;
      for (const [field, f] of Object.entries(spec.schema)) {
        if (f.defaultValue === undefined) {
          expect(payload[field], `${op}.${field} was invented`).toBeUndefined();
        } else if (f.type === 'array') {
          expect(payload[field], `${op}.${field}`).toEqual(f.defaultValue);
        }
      }
    });
  }
});

// A sign URL may carry SEVERAL operations (`/sign/ops/<b64>`, from
// encodeOps). Each one goes through the schema, so a list field is coerced
// in the third operation exactly as in a single-op URL, and the transaction's
// authority is judged across all of them.
describe('multi-operation URLs', () => {
  it('processes every operation in an ops URL, including list coercion', () => {
    const uri = encodeOps([
      [
        'vote',
        { voter: 'alice', author: 'bob', permlink: 'p', weight: '5000' },
      ],
      [
        'custom_json',
        { id: 'x', required_posting_auths: 'alice', json: '{"a":1}' },
      ],
      [
        'update_proposal_votes',
        { voter: 'alice', proposal_ids: '379', approve: 'true' },
      ],
    ]);
    const req = parseSignRequest(uri.replace('hive://sign/', ''), {}, 1);
    expect(req?.operations).toHaveLength(3);
    const [vote, cj, upv] =
      req?.operations.map(([, p]) => p as Record<string, unknown>) ?? [];
    expect(vote.weight).toBe(5000);
    expect(cj.required_posting_auths).toEqual(['alice']);
    expect(cj.required_auths).toEqual([]);
    expect(upv.proposal_ids).toEqual([379]);
  });

  it('every operation grouped by the authority it needs parses in one transaction and agrees on it', () => {
    // Grouped by the authority the PROCESSED operation needs, not the table
    // entry: account_update with an owner object escalates to owner.
    const groups = new Map<string, [string, Record<string, unknown>][]>();
    for (const [op, spec] of Object.entries(OPERATIONS)) {
      const raw: Record<string, unknown> = {};
      for (const [field, f] of Object.entries(spec.schema))
        raw[field] = sample(op, field, f.type);
      const single = parseSignRequest(
        encodeOps([[op, raw]]).replace('hive://sign/', ''),
        {},
        1,
      );
      const needs = requiredAuthority(single?.operations ?? []);
      expect(needs, `${op} has no single authority`).not.toBeNull();
      const list = groups.get(needs as string) ?? [];
      list.push([op, raw]);
      groups.set(needs as string, list);
    }
    expect([...groups.keys()].sort()).toEqual(['active', 'owner', 'posting']);
    for (const [authority, ops] of groups) {
      const req = parseSignRequest(
        encodeOps(ops).replace('hive://sign/', ''),
        {},
        1,
      );
      expect(req?.operations, authority).toHaveLength(ops.length);
      for (const [name, payload] of req?.operations ?? []) {
        for (const [field, f] of Object.entries(OPERATIONS[name].schema)) {
          expectTyped(
            name,
            field,
            f.type,
            (payload as Record<string, unknown>)[field],
          );
        }
      }
      // The whole transaction needs one authority, and it is this one.
      expect(requiredAuthority(req?.operations ?? []), authority).toBe(
        authority,
      );
    }
  });

  it('a transaction mixing posting and active operations has no single authority', () => {
    const uri = encodeOps([
      ['vote', { voter: 'alice', author: 'bob', permlink: 'p' }],
      ['transfer', { from: 'alice', to: 'bob', amount: '1 HIVE' }],
    ]);
    const req = parseSignRequest(uri.replace('hive://sign/', ''), {}, 1);
    expect(req?.operations).toHaveLength(2);
    expect(requiredAuthority(req?.operations ?? [])).toBeNull();
  });

  it('one bad list in a multi-op URL refuses the whole request rather than signing around it', () => {
    const uri = encodeOps([
      ['vote', { voter: 'alice', author: 'bob', permlink: 'p' }],
      [
        'remove_proposal',
        { proposal_owner: 'alice', proposal_ids: { not: 'a list' } },
      ],
    ]);
    expect(parseSignRequest(uri.replace('hive://sign/', ''), {}, 1)).toBeNull();
  });
});
