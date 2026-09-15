import { describe, expect, it } from 'vitest';
import { encodeOp } from '@/lib/hive-uri';
import { parseSignRequest } from '@/lib/parse-sign-request';

describe('signs -> sign handoff round-trip', () => {
  it('a /signs-built URL parses back into the same operation', () => {
    const uri = encodeOp([
      'transfer',
      { from: '', to: 'bob', amount: '1.000 HIVE', memo: 'hi' },
    ]);
    const path = uri.replace('hive://sign/', '');
    const req = parseSignRequest(path, {}, 1);
    expect(req).not.toBeNull();
    expect(req?.operations[0][0]).toBe('transfer');
    expect(req?.operations[0][1].to).toBe('bob');
    expect(req?.operations[0][1].amount).toBe('1.000 HIVE');
    expect(req?.operations[0][1].memo).toBe('hi');
  });
});
