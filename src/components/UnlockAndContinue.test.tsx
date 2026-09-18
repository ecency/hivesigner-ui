import { configure, getConfig, render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useEffect, useState } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import i18n from '../i18n';

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

describe('what the field does not do', () => {
  it('Enter on an empty passcode unlocks nothing', async () => {
    const view = render(<Screen />);
    const input = view.container.querySelector(
      'input[type=password]',
    ) as HTMLInputElement;
    input.focus();
    await userEvent.setup().keyboard('{Enter}');
    await new Promise((r) => setTimeout(r, 20));
    expect(readKeysCalls.count).toBe(0);
    expect(view.queryByRole('alert')).toBeNull();
  });

  it('a record without a passcode that fails to load says why, not "wrong passcode"', async () => {
    // No passcode, so no field: a wrong-passcode message would name
    // something the user cannot fix here.
    localStorage.setItem(
      'vuex__accounts',
      JSON.stringify({
        accountsKeychains: { alice: { password: 'zz-not-hexdecrypted' } },
        selectedAccount: 'alice',
      }),
    );
    _resetKeyCache();
    const view = render(<Screen />);
    expect(view.container.querySelector('input[type=password]')).toBeNull();
    await userEvent
      .setup()
      .click(view.getByRole('button', { name: 'Sign in' }));
    const alert = await view.findByRole('alert');
    expect(alert.textContent).not.toBe(i18n.t('login.invalid_hs_password'));
    expect(alert.textContent?.length).toBeGreaterThan(0);
  });
});

describe('a protected record that fails for another reason', () => {
  it('says why, not "wrong passcode"', async () => {
    const view = render(<Screen />);
    const input = view.container.querySelector(
      'input[type=password]',
    ) as HTMLInputElement;
    // Removed in another tab after this screen showed it.
    localStorage.setItem(
      'vuex__accounts',
      JSON.stringify({ accountsKeychains: {}, selectedAccount: '' }),
    );
    const user = userEvent.setup();
    await user.type(input, 'correct-passcode');
    await user.click(view.getByRole('button', { name: 'Sign in' }));
    const alert = await view.findByRole('alert');
    expect(alert.textContent).not.toBe(i18n.t('login.invalid_hs_password'));
    expect(alert).toHaveTextContent(/no such account/);
  });

  it('a wrong passcode still says so', async () => {
    const view = render(<Screen />);
    const user = userEvent.setup();
    await user.type(
      view.container.querySelector('input[type=password]') as HTMLElement,
      'nope',
    );
    await user.click(view.getByRole('button', { name: 'Sign in' }));
    expect(await view.findByRole('alert')).toHaveTextContent(
      i18n.t('login.invalid_hs_password'),
    );
  });
});

describe('what the screen gets before it shows the unlocked account', () => {
  // The screen stores the passcode in onOpened, and the form that needs it
  // (the active key) must mount already knowing it: a first render without
  // it asks for the passcode again. Two updates from the unlock (the screen's
  // state and the store) would otherwise commit apart. No act() here, for the
  // same reason as above.
  function Unlocked({
    held,
    seen,
  }: {
    held?: string;
    seen: (string | undefined)[];
  }) {
    useEffect(() => {
      seen.push(held);
    }, [held, seen]);
    return <div data-testid="unlocked">…</div>;
  }
  function HandOff({ seen }: { seen: (string | undefined)[] }) {
    const { unlocked } = useAccounts();
    const [held, setHeld] = useState<string | undefined>();
    if (unlocked.includes('alice')) return <Unlocked held={held} seen={seen} />;
    return (
      <UnlockAndContinue
        username="alice"
        action="Sign in"
        onOpened={(passcode) => setHeld(passcode)}
      />
    );
  }

  it('is in place in the very first unlocked render', async () => {
    const seen: (string | undefined)[] = [];
    const view = render(<HandOff seen={seen} />);
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
      button.click();
      for (let i = 0; i < 200 && !view.queryByTestId('unlocked'); i++) {
        await new Promise((r) => setTimeout(r, 10));
      }
      await new Promise((r) => setTimeout(r, 20));
      expect(seen[0]).toBe('correct-passcode');
    } finally {
      (
        globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
      ).IS_REACT_ACT_ENVIRONMENT = true;
    }
  });
});
