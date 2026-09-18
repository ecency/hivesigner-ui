import { describe, expect, it } from 'vitest';
import {
  detectFormat,
  encodePlain,
  encryptKeys,
  isEncrypted,
  isWrongPasscode,
  type Keys,
  needsUpgrade,
  readKeys,
  writeKeys,
} from './keystore';

// Real fields produced by the Nuxt app / triplesec 4.0.3.
const PLAIN_FIELD =
  '7b22706f7374696e67223a22354b54334c4b676b6f7655597a5156535833577045475a347264617a796f747069367069777664464d7878396569763867524c222c226d656d6f223a22354a4d656d6f4b65794578616d706c65227ddecrypted';
const PLAIN_KEYS: Keys = {
  posting: '5KT3LKgkovUYzQVSX3WpEGZ4rdazyotpi6piwvdFMxx9eiv8gRL',
  memo: '5JMemoKeyExample',
};
const TRIPLESEC_FIELD =
  '1c94d7de00000004aa5ea5bd0d06be50653efbb3e9fd71df45cfb875de86c27fed408e589c8021846f6f11848e2dfa3599ea2ce8a203a4b5415699854d7f82ed3db6b790d679086d20d3f4289144035b4804a52e9df15d88df43046eee75b9559e56c1bfc55b3be62412486034ae10e3b398d03093d4f1c34422454ab4fce4a1ad9241507aabdb364808b5ff3b871b1071a7ab41a290eda273fc4f5cf26524ef64386ecbe50e73b1555a10d60fbfbdc59297cc3e2682d8040d0e8a5c856b98c4a530a3d848622582f7d5942fa6374b8c9825d5727ad8e9af3108d04e00307b847a5cac78389f355548b30451fac4165323deacebd134872c99c1015605440ef4f1';
const TRIPLESEC_PASSCODE = 'unlock-passcode-123';
const TRIPLESEC_KEYS: Keys = {
  posting: '5KT3LKgkovUYzQVSX3WpEGZ4rdazyotpi6piwvdFMxx9eiv8gRL',
};

describe('format detection', () => {
  it('classifies the three stored forms', () => {
    expect(detectFormat(PLAIN_FIELD)).toBe('plain');
    expect(detectFormat(TRIPLESEC_FIELD)).toBe('triplesec');
    expect(detectFormat('{"v":1}')).toBe('v1');
  });

  it('reports which forms are encrypted and which need upgrading', () => {
    expect(isEncrypted(PLAIN_FIELD)).toBe(false);
    expect(isEncrypted(TRIPLESEC_FIELD)).toBe(true);
    expect(needsUpgrade(TRIPLESEC_FIELD)).toBe(true);
    expect(needsUpgrade(PLAIN_FIELD)).toBe(false);
  });
});

describe('reading legacy accounts', () => {
  it('reads a legacy plaintext account', async () => {
    expect(await readKeys(PLAIN_FIELD)).toEqual(PLAIN_KEYS);
  });

  it('round-trips the plaintext encoding', async () => {
    expect(await readKeys(encodePlain(PLAIN_KEYS))).toEqual(PLAIN_KEYS);
  });

  it('reads a legacy triplesec account with its passcode', async () => {
    expect(await readKeys(TRIPLESEC_FIELD, TRIPLESEC_PASSCODE)).toEqual(
      TRIPLESEC_KEYS,
    );
  });

  it('rejects a triplesec account with the wrong passcode', async () => {
    await expect(readKeys(TRIPLESEC_FIELD, 'nope')).rejects.toThrow();
  });

  it('requires a passcode for an encrypted account', async () => {
    await expect(readKeys(TRIPLESEC_FIELD)).rejects.toThrow(
      /passcode required/,
    );
  });
});

describe('new v1 envelope (WebCrypto AES-GCM)', () => {
  const keys: Keys = {
    active: '5Kactive',
    posting: '5Kposting',
    memo: '5Kmemo',
  };

  it('round-trips through encrypt and decrypt', async () => {
    const field = await encryptKeys(keys, 'my-passcode');
    expect(detectFormat(field)).toBe('v1');
    expect(await readKeys(field, 'my-passcode')).toEqual(keys);
  });

  it('fails to decrypt with the wrong passcode', async () => {
    const field = await encryptKeys(keys, 'my-passcode');
    await expect(readKeys(field, 'other')).rejects.toThrow(/wrong passcode/);
  });

  it('uses a fresh salt and iv each time', async () => {
    const a = await encryptKeys(keys, 'p');
    const b = await encryptKeys(keys, 'p');
    expect(a).not.toBe(b);
  });
});

describe('migration', () => {
  it('re-encrypts a triplesec account into the v1 envelope', async () => {
    const keys = await readKeys(TRIPLESEC_FIELD, TRIPLESEC_PASSCODE);
    const upgraded = await writeKeys(keys, TRIPLESEC_PASSCODE);
    expect(detectFormat(upgraded)).toBe('v1');
    expect(await readKeys(upgraded, TRIPLESEC_PASSCODE)).toEqual(keys);
  });

  it('writes plaintext when there is no passcode', async () => {
    const field = await writeKeys(PLAIN_KEYS);
    expect(detectFormat(field)).toBe('plain');
    expect(await readKeys(field)).toEqual(PLAIN_KEYS);
  });
});

describe('telling a wrong passcode from a record that cannot be read', () => {
  // The screens say "Wrong passcode" only for this, and show any other error
  // as it is. Both formats' messages must count: a legacy account's user
  // types the wrong passcode as often as anyone.
  const rejection = (p: Promise<unknown>) =>
    p.then(
      () => {
        throw new Error('expected a rejection');
      },
      (e: unknown) => e,
    );

  it('a legacy triplesec account with the wrong passcode', async () => {
    expect(
      isWrongPasscode(await rejection(readKeys(TRIPLESEC_FIELD, 'nope'))),
    ).toBe(true);
  });

  it('a v1 envelope with the wrong passcode', async () => {
    const field = await encryptKeys(PLAIN_KEYS, 'right');
    expect(isWrongPasscode(await rejection(readKeys(field, 'other')))).toBe(
      true,
    );
  });

  it('not a record that fails for another reason', async () => {
    const envelope = JSON.parse(await encryptKeys(PLAIN_KEYS, 'right'));
    envelope.kdf.N = 2 ** 30;
    expect(
      isWrongPasscode(
        await rejection(readKeys(JSON.stringify(envelope), 'right')),
      ),
    ).toBe(false);
    expect(isWrongPasscode(await rejection(readKeys(TRIPLESEC_FIELD)))).toBe(
      false,
    );
    expect(isWrongPasscode('wrong passcode')).toBe(false);
  });
});
