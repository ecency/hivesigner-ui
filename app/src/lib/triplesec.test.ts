import { describe, expect, it } from 'vitest';
import { decryptTriplesec } from './triplesec';

// A blob produced by the real triplesec 4.0.3 (the version the Nuxt app used),
// encrypting the plaintext below under the password below. If this decrypts,
// the reimplementation is byte-compatible with what existing accounts hold.
const BLOB_HEX =
  '1c94d7de00000004aa5ea5bd0d06be50653efbb3e9fd71df45cfb875de86c27fed408e589c8021846f6f11848e2dfa3599ea2ce8a203a4b5415699854d7f82ed3db6b790d679086d20d3f4289144035b4804a52e9df15d88df43046eee75b9559e56c1bfc55b3be62412486034ae10e3b398d03093d4f1c34422454ab4fce4a1ad9241507aabdb364808b5ff3b871b1071a7ab41a290eda273fc4f5cf26524ef64386ecbe50e73b1555a10d60fbfbdc59297cc3e2682d8040d0e8a5c856b98c4a530a3d848622582f7d5942fa6374b8c9825d5727ad8e9af3108d04e00307b847a5cac78389f355548b30451fac4165323deacebd134872c99c1015605440ef4f1';
const PASSWORD = 'unlock-passcode-123';
const PLAINTEXT =
  '{"posting":"5KT3LKgkovUYzQVSX3WpEGZ4rdazyotpi6piwvdFMxx9eiv8gRL"}';

function fromHex(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++)
    out[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return out;
}

describe('decryptTriplesec (v4)', () => {
  it('decrypts a real triplesec 4.0.3 blob to its plaintext', () => {
    const pt = decryptTriplesec(fromHex(BLOB_HEX), PASSWORD);
    expect(new TextDecoder().decode(pt)).toBe(PLAINTEXT);
  });

  it('rejects a wrong password via the HMAC check', () => {
    expect(() => decryptTriplesec(fromHex(BLOB_HEX), 'wrong')).toThrow(
      /signature mismatch/,
    );
  });

  it('rejects a non-triplesec blob', () => {
    expect(() => decryptTriplesec(new Uint8Array(200), PASSWORD)).toThrow(
      /bad magic/,
    );
  });

  it('rejects a truncated blob', () => {
    expect(() =>
      decryptTriplesec(fromHex(BLOB_HEX).subarray(0, 100), PASSWORD),
    ).toThrow(/too short/);
  });
});
