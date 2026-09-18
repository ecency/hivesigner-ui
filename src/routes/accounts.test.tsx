import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentType } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import i18n from '../i18n';

const rs = vi.hoisted(() => ({
  search: {} as { next?: string },
  navigate: vi.fn(),
  // Holds every unlock until released, when a test sets it.
  unlockGate: null as null | Promise<void>,
  // The leave latch's router subscription, to start a navigation away.
  onBeforeNavigate: new Set<(e: unknown) => void>(),
}));
vi.mock('@/lib/keystore', async (importOriginal) => {
  const real = await importOriginal<typeof import('@/lib/keystore')>();
  return {
    ...real,
    readKeys: async (field: string, passcode?: string) => {
      if (rs.unlockGate) await rs.unlockGate;
      return real.readKeys(field, passcode);
    },
  };
});

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (opts: unknown) => ({
    ...(opts as object),
    useSearch: () => rs.search,
  }),
  Link: ({
    children,
    to,
    search,
  }: {
    children: unknown;
    to: string;
    search?: Record<string, string>;
  }) => (
    <a href={to} data-search={search ? JSON.stringify(search) : undefined}>
      {children as never}
    </a>
  ),
  useNavigate: () => rs.navigate,
  useRouter: () => ({
    state: { location: { pathname: '/accounts', searchStr: '' } },
    subscribe: (_event: string, fn: (e: unknown) => void) => {
      rs.onBeforeNavigate.add(fn);
      return () => rs.onBeforeNavigate.delete(fn);
    },
  }),
}));

import {
  _resetKeyCache,
  addAccount,
  getState,
  isUnlocked,
  lockAccount,
  selectAccount,
} from '@/lib/accounts';
import { Route } from './accounts';

const Accounts = (Route as unknown as { component: ComponentType }).component;

beforeEach(() => {
  localStorage.clear();
  _resetKeyCache();
  rs.unlockGate = null;
  rs.navigate.mockReset();
});

describe('accounts switcher', () => {
  it('switches to a plaintext account on click without dropping others', async () => {
    await addAccount('alice', { posting: '5Ka' });
    await addAccount('bob', { posting: '5Kb' });
    // alice was selected (added first); switch to... alice is current, switch bob shown.
    const user = userEvent.setup();
    render(<Accounts />);

    // bob is not current -> has a switch control.
    const bobSwitch = screen.getByRole('button', { name: /switch/i });
    await user.click(bobSwitch);
    expect(getState().selectedAccount).toBe('bob');
    expect(isUnlocked('alice')).toBe(true); // not dropped
  });

  it('asks for a passcode before switching to a locked encrypted account', async () => {
    await addAccount('alice', { posting: '5Ka' });
    await addAccount('bob', { active: '5Kbob' }, 'pass');
    // Lock bob so it must be unlocked, and make alice the current account.
    lockAccount('bob');
    selectAccount('alice');

    const user = userEvent.setup();
    render(<Accounts />);

    // bob shows Unlock, not Switch.
    await user.click(screen.getByRole('button', { name: /^unlock$/i }));
    // A passcode field appears; wrong passcode shows an error.
    const field = document.querySelector('input[type="password"]');
    expect(field).toBeTruthy();
    await user.type(field as HTMLElement, 'wrong');
    await user.click(
      screen.getAllByRole('button', { name: /^unlock$/i }).at(-1)!,
    );
    expect(await screen.findByRole('alert')).toHaveTextContent(
      i18n.t('login.invalid_hs_password'),
    );
    expect(getState().selectedAccount).toBe('alice');

    // Right passcode unlocks and switches.
    await user.clear(field as HTMLElement);
    await user.type(field as HTMLElement, 'pass');
    await user.click(
      screen.getAllByRole('button', { name: /^unlock$/i }).at(-1)!,
    );
    await waitFor(() => expect(getState().selectedAccount).toBe('bob'));
    expect(isUnlocked('bob')).toBe(true);
  });
});

describe('returning to the flow that required an unlock', () => {
  const assign = vi.fn();

  beforeEach(() => {
    rs.search = {};
    rs.navigate.mockReset();
    assign.mockReset();
    vi.stubGlobal('location', {
      assign,
      origin: 'https://signer.example',
      pathname: '/accounts',
      search: '',
    });
  });

  /** alice selected, bob present but not in memory (as after a reload). */
  async function twoAccounts() {
    await addAccount('alice', { posting: '5Ka' });
    await addAccount('bob', { posting: '5Kb' });
    selectAccount('alice');
    lockAccount('bob');
  }

  it('returns CLIENT-SIDE, so the just-unlocked keys survive', async () => {
    // Decrypted keys are in memory only. A document navigation would reload the
    // app, re-lock the account and bounce the user back here forever, so this
    // must never touch window.location.
    rs.search = { next: '/oauth2/authorize?client_id=theapp' };
    await twoAccounts();
    render(<Accounts />);
    await userEvent.click(screen.getByRole('button', { name: /unlock/i }));
    await waitFor(() => expect(rs.navigate).toHaveBeenCalled());
    expect(rs.navigate).toHaveBeenCalledWith({
      to: '/oauth2/authorize',
      search: { client_id: 'theapp' },
    });
    expect(assign).not.toHaveBeenCalled();
    expect(isUnlocked('bob')).toBe(true);
  });

  it('refuses every off-site next, including backslash forms', async () => {
    // `/\\evil.example/x` and `\\/evil.example` resolve to an EXTERNAL origin
    // even though they start with a single '/', so a startsWith check is not
    // enough; `/..//evil.example` stays same-origin but resolves to a
    // protocol-relative path.
    for (const bad of [
      'https://evil.example/x',
      '//evil.example/x',
      '/\\evil.example/after-unlock',
      '\\/evil.example',
      '/..//evil.example',
    ]) {
      localStorage.clear();
      _resetKeyCache();
      rs.search = { next: bad };
      rs.navigate.mockReset();
      assign.mockReset();
      await twoAccounts();
      const view = render(<Accounts />);
      await userEvent.click(screen.getByRole('button', { name: /unlock/i }));
      await waitFor(() => expect(getState().selectedAccount).toBe('bob'));
      expect(rs.navigate, `next=${bad}`).not.toHaveBeenCalled();
      expect(assign, `next=${bad}`).not.toHaveBeenCalled();
      view.unmount();
    }
  });

  it('still returns for a plain internal path with no query', async () => {
    rs.search = { next: '/authorized-apps' };
    await twoAccounts();
    render(<Accounts />);
    await userEvent.click(screen.getByRole('button', { name: /unlock/i }));
    await waitFor(() =>
      expect(rs.navigate).toHaveBeenCalledWith({
        to: '/authorized-apps',
        search: {},
      }),
    );
  });
});

describe('adding an account from a request keeps the request', () => {
  // A user who came here from a consent or sign request to switch accounts,
  // and finds the one they want is not on the device, follows "Add another
  // account". Without `next` on that link the import finished on the account
  // list and the request was gone.
  it('both add-account links carry next when there is one', async () => {
    await addAccount('alice', { posting: '5Ka' });
    rs.search = { next: '/sign/vote?voter=alice' };
    render(<Accounts />);
    const links = screen.getAllByRole('link', { name: /add another/i });
    expect(links.length).toBeGreaterThan(0);
    for (const l of links) {
      expect(l).toHaveAttribute('href', '/import');
      expect(JSON.parse(l.getAttribute('data-search') ?? '{}')).toEqual({
        next: '/sign/vote?voter=alice',
      });
    }
  });

  it('with no accounts at all, the only link still carries next', () => {
    rs.search = { next: '/oauth2/authorize?client_id=theapp' };
    render(<Accounts />);
    for (const l of screen.getAllByRole('link', { name: /add another/i })) {
      expect(JSON.parse(l.getAttribute('data-search') ?? '{}').next).toBe(
        '/oauth2/authorize?client_id=theapp',
      );
    }
  });

  it('adds no next key when there is nothing to return to', async () => {
    await addAccount('alice', { posting: '5Ka' });
    rs.search = {};
    render(<Accounts />);
    for (const l of screen.getAllByRole('link', { name: /add another/i })) {
      expect(JSON.parse(l.getAttribute('data-search') ?? '{}')).toEqual({});
    }
  });
});

describe('plaintext unlock failure', () => {
  it('shows the error even though the passcode form never opens', async () => {
    // A corrupt persisted plaintext keystore rejects in unlockAccount. The row
    // stays in its normal state (unlocking is false), so an error rendered only
    // inside the passcode form would never be seen.
    await addAccount('alice', { posting: '5Ka' });
    await addAccount('bob', { posting: '5Kb' });
    selectAccount('alice');
    lockAccount('bob');
    // Corrupt bob's stored blob.
    const raw = JSON.parse(localStorage.getItem('vuex__accounts') as string);
    // Detected as the legacy PLAINTEXT format (it ends with the marker) but its
    // hex body is junk, so readKeys rejects without opening a passcode form.
    raw.accountsKeychains.bob.password = 'zzdecrypted';
    localStorage.setItem('vuex__accounts', JSON.stringify(raw));

    render(<Accounts />);
    await userEvent.click(screen.getByRole('button', { name: /unlock/i }));
    expect(await screen.findByRole('alert')).toBeInTheDocument();
    // And it did not silently select the account it could not unlock.
    expect(getState().selectedAccount).toBe('alice');
  });
});

describe('unlock and password managers (#136)', () => {
  beforeEach(() => {
    rs.search = { next: '/oauth2/authorize?client_id=theapp' };
    rs.navigate.mockReset();
  });

  it('keeps managers away from the passcode, unlocks on Enter and empties it before leaving', async () => {
    await addAccount('bob', { posting: '5Kbob' }, 'pass');
    lockAccount('bob');
    let fieldAtNavigation: string | null | undefined = 'unset';
    rs.navigate.mockImplementation(() => {
      fieldAtNavigation =
        (document.querySelector('input[type="password"]') as HTMLInputElement)
          ?.value ?? null;
    });
    const user = userEvent.setup();
    render(<Accounts />);
    await user.click(screen.getByRole('button', { name: /^unlock$/i }));
    const field = document.querySelector(
      'input[type="password"]',
    ) as HTMLInputElement;
    expect(field).toHaveAttribute('autocomplete', 'one-time-code');
    expect(field).toHaveAttribute('data-1p-ignore', 'true');
    // Enter on an empty field does nothing: no attempt, no error.
    await user.type(field, '{Enter}');
    await new Promise((r) => setTimeout(r, 50));
    expect(screen.queryByRole('alert')).toBeNull();
    expect(isUnlocked('bob')).toBe(false);
    await user.type(field, 'pass{Enter}');
    await waitFor(() => expect(rs.navigate).toHaveBeenCalled(), {
      timeout: 10_000,
    });
    expect(isUnlocked('bob')).toBe(true);
    // Gone, or at least empty, by the time the page changes.
    expect(fieldAtNavigation === null || fieldAtNavigation === '').toBe(true);
  }, 30_000);
});

describe('a second choice made while an unlock runs', () => {
  it('wins: the account being unlocked is opened but not chosen', async () => {
    await addAccount('alice', { posting: '5Ka' });
    await addAccount('bob', { active: '5Kbob' }, 'pass');
    await addAccount('carol', { posting: '5Kc' });
    lockAccount('bob');
    selectAccount('alice');
    let release = () => {};
    rs.unlockGate = new Promise<void>((r) => {
      release = r;
    });
    const user = userEvent.setup();
    render(<Accounts />);
    await user.click(screen.getByRole('button', { name: /^unlock$/i }));
    const field = document.querySelector('input[type="password"]');
    await user.type(field as HTMLElement, 'pass');
    await user.click(
      screen.getAllByRole('button', { name: /^unlock$/i }).at(-1)!,
    );
    // While bob's passcode is checked, the user picks carol.
    const carol = screen
      .getAllByTestId('account-row')
      .find((row) => row.textContent?.includes('@carol')) as HTMLElement;
    await user.click(
      within(carol).getByRole('button', { name: /switch an account/i }),
    );
    expect(getState().selectedAccount).toBe('carol');
    release();
    await waitFor(() => expect(isUnlocked('bob')).toBe(true));
    await new Promise((r) => setTimeout(r, 20));
    expect(getState().selectedAccount).toBe('carol');
    // And its passcode form is closed, not left filled in.
    expect(document.querySelector('input[type="password"]')).toBeNull();
  });
});

describe('an unlock that finishes after the user set off', () => {
  beforeEach(() => {
    rs.search = { next: '/oauth2/authorize?client_id=theapp' };
  });

  /** Renders the list and submits bob's passcode, the unlock held. */
  async function unlockBobHeld() {
    let release = () => {};
    rs.unlockGate = new Promise<void>((r) => {
      release = r;
    });
    const user = userEvent.setup();
    render(<Accounts />);
    const bob = screen
      .getAllByTestId('account-row')
      .find((row) => row.textContent?.includes('@bob')) as HTMLElement;
    await user.click(within(bob).getByRole('button', { name: /^unlock$/i }));
    await user.type(
      within(bob).getByLabelText(/passcode/i) as HTMLElement,
      'pass',
    );
    await user.click(within(bob).getAllByRole('button').at(-1)!);
    return release;
  }

  it('chooses nothing and goes nowhere, and closes the form', async () => {
    await addAccount('alice', { posting: '5Ka' });
    await addAccount('bob', { active: '5Kbob' }, 'pass');
    lockAccount('bob');
    selectAccount('alice');
    const release = await unlockBobHeld();
    for (const fn of rs.onBeforeNavigate)
      fn({ toLocation: { pathname: '/', searchStr: '' } });
    release();
    await waitFor(() => expect(isUnlocked('bob')).toBe(true));
    await new Promise((r) => setTimeout(r, 20));
    expect(getState().selectedAccount).toBe('alice');
    expect(rs.navigate).not.toHaveBeenCalled();
    expect(document.querySelector('input[type="password"]')).toBeNull();
  });

  it('another tab choosing someone meanwhile does not undo this click', async () => {
    await addAccount('alice', { posting: '5Ka' });
    await addAccount('bob', { active: '5Kbob' }, 'pass');
    await addAccount('carol', { posting: '5Kc' });
    selectAccount('alice');
    // As after a reload: nothing in memory, no choice made in this tab yet,
    // so the stored choice is the one another tab can change.
    _resetKeyCache();
    const release = await unlockBobHeld();
    const raw = JSON.parse(localStorage.getItem('vuex__accounts') as string);
    localStorage.setItem(
      'vuex__accounts',
      JSON.stringify({ ...raw, selectedAccount: 'carol' }),
    );
    release();
    await waitFor(() => expect(getState().selectedAccount).toBe('bob'));
    expect(rs.navigate).toHaveBeenCalled();
  });
});

describe('more choices made while an unlock runs', () => {
  beforeEach(() => {
    rs.search = { next: '/oauth2/authorize?client_id=theapp' };
  });

  const row = (name: string) =>
    screen
      .getAllByTestId('account-row')
      .find((r) => r.textContent?.includes(`@${name}`)) as HTMLElement;

  function holdUnlocks() {
    let release = () => {};
    rs.unlockGate = new Promise<void>((r) => {
      release = r;
    });
    return () => release();
  }

  it("opening another row's passcode form is a choice: nobody is taken away mid-typing", async () => {
    await addAccount('alice', { posting: '5Ka' });
    await addAccount('bob', { active: '5Kbob' }, 'pass');
    await addAccount('dave', { active: '5Kdave' }, 'pass');
    lockAccount('bob');
    lockAccount('dave');
    selectAccount('alice');
    const release = holdUnlocks();
    const user = userEvent.setup();
    render(<Accounts />);
    await user.click(
      within(row('bob')).getByRole('button', { name: /^unlock$/i }),
    );
    await user.type(within(row('bob')).getByLabelText(/passcode/i), 'pass');
    await user.click(within(row('bob')).getAllByRole('button').at(-1)!);
    // While bob's passcode is checked, the user opens dave's form.
    await user.click(
      within(row('dave')).getByRole('button', { name: /^unlock$/i }),
    );
    release();
    await waitFor(() => expect(isUnlocked('bob')).toBe(true));
    await new Promise((r) => setTimeout(r, 20));
    expect(getState().selectedAccount).toBe('alice');
    expect(rs.navigate).not.toHaveBeenCalled();
    expect(within(row('dave')).getByLabelText(/passcode/i)).toBeInTheDocument();
  });

  it('an account without a passcode: a later choice wins too', async () => {
    await addAccount('alice', { posting: '5Ka' });
    await addAccount('bob', { posting: '5Kb' });
    await addAccount('carol', { posting: '5Kc' });
    selectAccount('alice');
    // bob is on disk but not in memory, as after a reload.
    lockAccount('bob');
    const release = holdUnlocks();
    const user = userEvent.setup();
    render(<Accounts />);
    await user.click(
      within(row('bob')).getByRole('button', { name: /^unlock$/i }),
    );
    await user.click(
      within(row('carol')).getByRole('button', { name: /switch an account/i }),
    );
    expect(getState().selectedAccount).toBe('carol');
    release();
    await waitFor(() => expect(isUnlocked('bob')).toBe(true));
    await new Promise((r) => setTimeout(r, 20));
    expect(getState().selectedAccount).toBe('carol');
  });
});

describe('a protected record that fails for another reason', () => {
  it('says why, not "wrong passcode"', async () => {
    await addAccount('alice', { posting: '5Ka' });
    await addAccount('bob', { active: '5Kbob' }, 'pass');
    lockAccount('bob');
    selectAccount('alice');
    // Its key-derivation cost is out of the range ever written: it fails
    // before any passcode is tried.
    const raw = JSON.parse(localStorage.getItem('vuex__accounts') as string);
    const envelope = JSON.parse(raw.accountsKeychains.bob.password);
    envelope.kdf.N = 2 ** 30;
    raw.accountsKeychains.bob.password = JSON.stringify(envelope);
    localStorage.setItem('vuex__accounts', JSON.stringify(raw));
    const user = userEvent.setup();
    render(<Accounts />);
    await user.click(screen.getByRole('button', { name: /^unlock$/i }));
    await user.type(screen.getByLabelText(/passcode/i), 'pass');
    await user.click(
      screen.getAllByRole('button', { name: /^unlock$/i }).at(-1)!,
    );
    expect(await screen.findByRole('alert')).toHaveTextContent(
      /unsupported key-derivation cost/,
    );
  });
});
