import { afterEach, describe, expect, it } from 'vitest';
import { installTestDictionary } from '../test-i18n';
import i18n from './index';
import { joinParts, sentenceParts } from './parts';

let undo = async () => {};
afterEach(() => undo());

describe('sentenceParts', () => {
  it('puts each value where the translation puts it, exactly as given', async () => {
    undo = await installTestDictionary('fa', {
      summary: { transfer: '{to} ← {amount} ارسال' },
    });
    const parts = sentenceParts(i18n.t, 'summary.transfer', {
      amount: '1.000 HIVE',
      to: '@bob',
    });
    expect(parts).toEqual([
      { value: '@bob' },
      ' ← ',
      { value: '1.000 HIVE' },
      ' ارسال',
    ]);
    expect(joinParts(parts)).toBe('@bob ← 1.000 HIVE ارسال');
  });

  it('never reads a value as a placeholder, markup or marker', () => {
    const tricky = '{to} <b>x</b> to {{amount}}';
    const parts = sentenceParts(i18n.t, 'summary.transfer', {
      amount: tricky,
      to: '@bob',
    });
    expect(parts).toEqual([
      'Send ',
      { value: tricky },
      ' to ',
      { value: '@bob' },
    ]);
  });

  it('chooses the plural form by count and writes the count as copy', async () => {
    const key = 'sign.contains_operations';
    expect(joinParts(sentenceParts(i18n.t, key, {}, 1))).toBe(
      'This request contains 1 operation. Review it before approving.',
    );
    undo = await installTestDictionary('ru', {
      sign: {
        contains_operations_one: '{count} операция',
        contains_operations_few: '{count} операции',
        contains_operations_many: '{count} операций',
        contains_operations_other: '{count} операции (дробь)',
      },
    });
    expect(sentenceParts(i18n.t, key, {}, 21)).toEqual(['21 операция']);
    expect(sentenceParts(i18n.t, key, {}, 3)).toEqual(['3 операции']);
    expect(sentenceParts(i18n.t, key, {}, 11)).toEqual(['11 операций']);
  });

  it('falls back to English for a string the translation lacks', async () => {
    undo = await installTestDictionary('fa', { summary: {} });
    expect(
      joinParts(sentenceParts(i18n.t, 'summary.memo', { memo: 'm' })),
    ).toBe('Memo: m');
  });

  it('leaves out a value the translation does not use rather than inventing one', async () => {
    undo = await installTestDictionary('fa', {
      summary: { transfer: 'ارسال {amount}' },
    });
    expect(
      sentenceParts(i18n.t, 'summary.transfer', { amount: '1', to: '@bob' }),
    ).toEqual(['ارسال ', { value: '1' }]);
  });
});
