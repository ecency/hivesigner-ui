import { configure, getConfig, render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const readKeysCalls = vi.hoisted(() => ({ count: 0 }));
vi.mock('@/lib/keystore', async (importOriginal) => {
  const real = await importOriginal<typeof import('@/lib/keystore')>();
  return {
    ...real,
    readKeys: async (field: string, passcode?: string) => {
      readKeysCalls.count++;
      return real.readKeys(field, passcode);
    },
  };
});

import { _resetKeyCache, addAccount, lockAccount } from '@/lib/accounts';
import { useAccounts } from '@/lib/use-accounts';
import { UnlockAndContinue } from './UnlockAndContinue';

// A password manager that captures a field as it leaves the page must find
// it empty (#136). The screens that host UnlockAndContinue re-render from the
// store the moment unlockAccount emits and drop the field before the unlock's
// caller resumes. React's act() batches that store update with the
// component's own flushSync in tests, which hides the real order, so act is
// switched OFF here and the browser's own scheduling (microtasks) is used.

function Screen() {
  const { unlocked } = useAccounts();
  if (unlocked.includes('alice')) return <div data-testid="unlocked">…</div>;
  return (
    <UnlockAndContinue
      username="alice"
      action="Sign in"
      onUnlocked={() => {}}
    />
  );
}

const valueSetter = Object.getOwnPropertyDescriptor(
  HTMLInputElement.prototype,
  'value',
)?.set as (this: HTMLInputElement, v: string) => void;

beforeEach(async () => {
  readKeysCalls.count = 0;
  localStorage.clear();
  _resetKeyCache();
  await addAccount('alice', { posting: '5Kposting' }, 'correct-passcode');
  lockAccount('alice');
});

describe('the passcode field on unlock', () => {
  it('leaves the DOM with its value already emptied', async () => {
    const view = render(<Screen />);
    const input = view.container.querySelector(
      'input[type=password]',
    ) as HTMLInputElement;
    const button = view.getByRole('button', { name: 'Sign in' });

    // What a password manager that captures on removal would find.
    const removedValues: string[] = [];
    const observer = new MutationObserver((records) => {
      for (const r of records) {
        for (const n of r.removedNodes) {
          if (n instanceof HTMLElement) {
            const inputs = [
              ...(n.matches('input') ? [n as HTMLInputElement] : []),
              ...Array.from(n.querySelectorAll('input')),
            ];
            for (const i of inputs) removedValues.push(i.value);
          }
        }
      }
    });
    observer.observe(view.container, { childList: true, subtree: true });

    // No act() from here on: real browser scheduling.
    const { eventWrapper, asyncWrapper } = getConfig();
    (
      globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = false;
    configure({
      eventWrapper: (cb) => cb(),
      asyncWrapper: async (cb) => cb(),
    });
    try {
      valueSetter.call(input, 'correct-passcode');
      input.dispatchEvent(new Event('input', { bubbles: true }));
      await new Promise((r) => setTimeout(r, 0));
      expect(button).toBeEnabled();
      button.click();
      // Wait for the screen to move on.
      for (let i = 0; i < 200 && !view.queryByTestId('unlocked'); i++) {
        await new Promise((r) => setTimeout(r, 10));
      }
      expect(view.queryByTestId('unlocked')).not.toBeNull();
      await new Promise((r) => setTimeout(r, 0));
      observer.disconnect();
      expect(removedValues.length).toBeGreaterThan(0);
      expect(removedValues).toEqual(removedValues.map(() => ''));
    } finally {
      (
        globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
      ).IS_REACT_ACT_ENVIRONMENT = true;
      configure({ eventWrapper, asyncWrapper });
    }
  });
});

describe('double submission without act()', () => {
  it('Enter, then clicks while the unlock runs, unlock once (events are separate tasks)', async () => {
    const view = render(<Screen />);
    const input = view.container.querySelector(
      'input[type=password]',
    ) as HTMLInputElement;
    const button = view.getByRole('button', { name: 'Sign in' });
    (
      globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = false;
    try {
      valueSetter.call(input, 'correct-passcode');
      input.dispatchEvent(new Event('input', { bubbles: true }));
      await new Promise((r) => setTimeout(r, 0));
      input.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }),
      );
      // A user's next event is a new task: React has flushed by then.
      await new Promise((r) => setTimeout(r, 0));
      expect((button as HTMLButtonElement).disabled).toBe(true);
      button.click();
      await new Promise((r) => setTimeout(r, 0));
      button.click();
      input.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }),
      );
      for (let i = 0; i < 200 && !view.queryByTestId('unlocked'); i++) {
        await new Promise((r) => setTimeout(r, 10));
      }
      expect(view.queryByTestId('unlocked')).not.toBeNull();
      expect(readKeysCalls.count).toBe(1);
    } finally {
      (
        globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
      ).IS_REACT_ACT_ENVIRONMENT = true;
    }
  });
});
