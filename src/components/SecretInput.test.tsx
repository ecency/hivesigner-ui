import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { SecretInput } from './SecretInput';

// A secret password managers must leave alone (#136): what each manager reads
// has to be on the field, and the field must not belong to the form around it.
function Harness({
  onSubmit,
  onEnter,
  disabled = false,
}: {
  onSubmit: () => void;
  onEnter?: 'submit-form' | (() => void);
  disabled?: boolean;
}) {
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  return (
    <form
      data-testid="outer"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <input name="username" autoComplete="username" />
      <input name="password" type="password" autoComplete="current-password" />
      <label>
        First
        <SecretInput name="first" value={a} onChange={setA} onEnter={onEnter} />
      </label>
      <label>
        Second
        <SecretInput name="second" value={b} onChange={setB} />
      </label>
      <button type="submit" disabled={disabled}>
        Go
      </button>
    </form>
  );
}

describe('SecretInput', () => {
  it('carries every signal password managers read, and stays a password field', () => {
    render(<Harness onSubmit={() => {}} />);
    const input = screen.getByLabelText('First') as HTMLInputElement;
    expect(input.type).toBe('password');
    expect(input).toHaveAttribute('autocomplete', 'one-time-code');
    expect(input).toHaveAttribute('data-1p-ignore', 'true');
    expect(input).toHaveAttribute('data-lpignore', 'true');
    expect(input).toHaveAttribute('data-bwignore', 'true');
    expect(input).toHaveAttribute('data-form-type', 'other');
    expect(input).toHaveAttribute('spellcheck', 'false');
  });

  it('belongs to a detached form of its own, never to the form around it or to another secret', () => {
    render(<Harness onSubmit={() => {}} />);
    const outer = screen.getByTestId('outer') as HTMLFormElement;
    const first = screen.getByLabelText('First') as HTMLInputElement;
    const second = screen.getByLabelText('Second') as HTMLInputElement;
    // Not formless (formless fields are grouped together by some managers).
    expect(first.form).toBeInstanceOf(HTMLFormElement);
    expect(first.form).not.toBe(outer);
    expect(outer.contains(first.form)).toBe(false);
    expect(second.form).not.toBe(first.form);
    // The outer form holds the login and nothing secret besides it.
    const names = Array.from(outer.elements).map(
      (el) => (el as HTMLInputElement).name,
    );
    expect(names).toContain('password');
    expect(names).not.toContain('first');
    expect(names).not.toContain('second');
  });

  it('submits the form it sits in on Enter, and never its own', async () => {
    const onSubmit = vi.fn();
    const stray = vi.fn();
    render(<Harness onSubmit={onSubmit} onEnter="submit-form" />);
    const input = screen.getByLabelText('First') as HTMLInputElement;
    input.form?.addEventListener('submit', stray);
    await userEvent.setup().type(input, 'secret{Enter}');
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(stray).not.toHaveBeenCalled();
    expect(input).toHaveValue('secret');
  });

  it('cancels Enter itself, so a browser never submits the detached form', () => {
    // A browser submits a field's own form on Enter (its form owner holds
    // this one field). user-event does not model that for an input tied to
    // a form by attribute, so the cancellation is checked directly.
    render(<Harness onSubmit={() => {}} />);
    const notCancelled = fireEvent.keyDown(screen.getByLabelText('Second'), {
      key: 'Enter',
    });
    expect(notCancelled).toBe(false);
    // Any other key is left alone.
    expect(
      fireEvent.keyDown(screen.getByLabelText('Second'), { key: 'a' }),
    ).toBe(true);
  });

  it('submits nothing on Enter while the form’s button is disabled, as implicit submission would', async () => {
    const onSubmit = vi.fn();
    render(<Harness onSubmit={onSubmit} onEnter="submit-form" disabled />);
    await userEvent.setup().type(screen.getByLabelText('First'), 'x{Enter}');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('still submits where the browser has no requestSubmit', async () => {
    const original = HTMLFormElement.prototype.requestSubmit;
    // @ts-expect-error simulating an engine without it
    HTMLFormElement.prototype.requestSubmit = undefined;
    try {
      const onSubmit = vi.fn();
      render(<Harness onSubmit={onSubmit} onEnter="submit-form" />);
      await userEvent.setup().type(screen.getByLabelText('First'), 'x{Enter}');
      expect(onSubmit).toHaveBeenCalledTimes(1);
    } finally {
      HTMLFormElement.prototype.requestSubmit = original;
    }
  });

  it('leaves Enter alone while an input method is composing', () => {
    const onEnter = vi.fn();
    render(<Harness onSubmit={() => {}} onEnter={onEnter} />);
    const notCancelled = fireEvent.keyDown(screen.getByLabelText('First'), {
      key: 'Enter',
      isComposing: true,
    });
    expect(notCancelled).toBe(true);
    expect(onEnter).not.toHaveBeenCalled();
  });

  it('calls a handler on Enter instead, when given one', async () => {
    const onSubmit = vi.fn();
    const onEnter = vi.fn();
    render(<Harness onSubmit={onSubmit} onEnter={onEnter} />);
    await userEvent.setup().type(screen.getByLabelText('First'), 'x{Enter}');
    expect(onEnter).toHaveBeenCalledTimes(1);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('does nothing on Enter without a handler', async () => {
    const onSubmit = vi.fn();
    render(<Harness onSubmit={onSubmit} />);
    const second = screen.getByLabelText('Second') as HTMLInputElement;
    const stray = vi.fn();
    second.form?.addEventListener('submit', stray);
    await userEvent.setup().type(second, 'x{Enter}');
    expect(onSubmit).not.toHaveBeenCalled();
    expect(stray).not.toHaveBeenCalled();
  });
});
