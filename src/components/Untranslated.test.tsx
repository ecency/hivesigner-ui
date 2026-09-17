import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import i18n from '../i18n';
import { wholeText } from '../test-text';
import { Handle, Sentence } from './Untranslated';

afterEach(async () => {
  await act(() => i18n.changeLanguage('en'));
});

describe('Handle', () => {
  it('shows @name as one untranslatable string', () => {
    render(<Handle name="alice" className="font-bold" />);
    const el = screen.getByText('@alice');
    expect(el).toHaveAttribute('translate', 'no');
    expect(el.className).toBe('[unicode-bidi:isolate] font-bold');
    expect(el.childNodes).toHaveLength(1);
  });
});

describe('Sentence', () => {
  const key = 'authorize.grant_explain';
  const values = { app: 'ecency.app', account: 'alice' };

  it('reads as the translated sentence, with each value kept as it is', () => {
    const { container } = render(<Sentence k={key} values={values} />);
    const text = i18n.t(key, values);
    expect(screen.getByText(wholeText(text))).toBe(container.firstChild);
    const kept = container.querySelectorAll('[translate="no"]');
    expect(Array.from(kept, (el) => el.textContent)).toEqual([
      'ecency.app',
      'alice',
    ]);
    // Only the values are marked: the copy around them stays translatable.
    for (const el of kept) expect(el.childNodes).toHaveLength(1);
    expect(container.textContent).toBe(text);
  });

  it('never shows a value as markup or a marker, whatever it holds', () => {
    const { container } = render(
      <Sentence
        k="authorize.granted"
        values={{ app: '<b>x</b> \uE000app\uE001' }}
      />,
    );
    expect(container.querySelector('b')).toBeNull();
    expect(container.textContent).toBe(
      i18n.t('authorize.granted', { app: '<b>x</b> \uE000app\uE001' }),
    );
  });

  it('updates a value in place and rebuilds for another sentence or language', async () => {
    const { container, rerender } = render(
      <Sentence k={key} values={values} />,
    );
    const first = container.firstChild;
    rerender(<Sentence k={key} values={{ ...values, account: 'bob' }} />);
    expect(container.firstChild).toBe(first);
    expect(container.textContent).toBe(
      i18n.t(key, { ...values, account: 'bob' }),
    );
    rerender(<Sentence k="authorize.granted" values={{ app: 'ecency.app' }} />);
    expect(container.firstChild).not.toBe(first);
    const second = container.firstChild;
    await act(() => i18n.changeLanguage('ru'));
    expect(container.firstChild).not.toBe(second);
    expect(container.textContent).toBe(
      i18n.t('authorize.granted', { app: 'ecency.app' }),
    );
  });

  it('bolds values when asked, with any extra class', () => {
    const { container } = render(
      <Sentence
        k="sign.going_redirect_to"
        values={{ host: 'app.example' }}
        bold
        valueClassName="text-ink"
      />,
    );
    const value = container.querySelector('b');
    expect(value).toHaveTextContent('app.example');
    expect(value).toHaveAttribute('translate', 'no');
    expect(value?.className).toBe('[unicode-bidi:isolate] text-ink');
  });

  it('picks the plural form from count', () => {
    const { container, rerender } = render(
      <Sentence k="sign.carries_signatures" count={1} values={{}} />,
    );
    expect(container.textContent).toBe('It already carries 1 signature.');
    rerender(<Sentence k="sign.carries_signatures" count={2} values={{}} />);
    expect(container.textContent).toBe('It already carries 2 signatures.');
  });
});
