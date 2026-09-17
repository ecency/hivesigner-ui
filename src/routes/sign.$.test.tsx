import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentType } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { installTestDictionary } from '../test-i18n';
import { wholeText } from '../test-text';

// Regression tests for the sign route wiring (findings: no_broadcast must not
// broadcast; HP requests must wait for a real rate). Real parseSignRequest runs;
// only the chain side effects and account state are mocked.
const h = vi.hoisted(() => ({
  splat: 'vote',
  search: {} as Record<string, string>,
  vests: { rate: 1, ready: true },
  accounts: { selectedAccount: 'alice', unlocked: ['alice'] },
  keys: { posting: '5Kposting', active: '5Kactive' } as Record<
    string,
    string
  > | null,
  signOperations: vi.fn(),
  broadcastOperations: vi.fn(),
}));

const sig = vi.hoisted(() => ({ report: vi.fn() }));
vi.mock('@/lib/integration-signal', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/integration-signal')>()),
  reportIntegrationIssue: sig.report,
}));
vi.mock('@sentry/browser', () => ({
  captureFeedback: vi.fn(),
  getClient: () => undefined,
}));
vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (opts: unknown) => ({
    ...(opts as object),
    useParams: () => ({ _splat: h.splat }),
    useSearch: () => h.search,
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
}));
vi.mock('@tanstack/react-query', () => ({
  // The real queryFn (getVestsToSp) resolves to a NUMBER; model that.
  useQuery: () => ({ data: h.vests.rate, isSuccess: h.vests.ready }),
}));
vi.mock('@/lib/hive', () => ({ getVestsToSp: vi.fn() }));
vi.mock('@/lib/use-accounts', () => ({ useAccounts: () => h.accounts }));
vi.mock('@/lib/accounts', () => ({ getKeys: () => h.keys }));
// Mock only the signing/broadcast calls. resolveSigner stays REAL: the route
// uses it to resolve __signer for display, and the whole point is that display
// and signing share one resolver, so stubbing it would hide a divergence.
vi.mock('@/lib/sign-tx', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/sign-tx')>()),
  signOperations: h.signOperations,
  broadcastOperations: h.broadcastOperations,
}));

import { Route } from './sign.$';

const Sign = (Route as unknown as { component: ComponentType }).component;

beforeEach(() => {
  h.splat = 'vote';
  h.search = { author: 'a', permlink: 'p', weight: '10000' };
  h.vests = { rate: 1, ready: true };
  h.accounts = { selectedAccount: 'alice', unlocked: ['alice'] };
  h.keys = { posting: '5Kposting', active: '5Kactive' };
  h.signOperations
    .mockReset()
    .mockResolvedValue({ id: 'tx1', signature: 'SIG' });
  h.broadcastOperations.mockReset().mockResolvedValue({ id: 'tx1' });
});

describe('sign route', () => {
  it('broadcasts a normal vote on approve', async () => {
    const user = userEvent.setup();
    render(<Sign />);
    await user.click(screen.getByRole('button', { name: /approve/i }));
    await waitFor(() => expect(h.broadcastOperations).toHaveBeenCalled());
    expect(h.signOperations).not.toHaveBeenCalled();
  });

  it('a no_broadcast request signs but never broadcasts', async () => {
    // ?nb via an encoded op is awkward here; drive it through the vote path with
    // a no_broadcast flag by encoding is covered in lib tests. Here we assert the
    // route branch: set nb through the search the parser reads.
    h.splat = 'vote';
    // Build an nb request: the parser reads no_broadcast from a hive-uri; simulate
    // by using the op form. Use a signed op with nb through the encoded path.
    const { encodeOp } = await import('@/lib/hive-uri');
    const uri = encodeOp(
      ['vote', { voter: 'alice', author: 'a', permlink: 'p', weight: 1 }],
      { no_broadcast: true },
    );
    const [path, qs] = uri.replace('hive://sign/', '').split('?');
    h.splat = path;
    h.search = Object.fromEntries(new URLSearchParams(qs));
    const user = userEvent.setup();
    render(<Sign />);
    await user.click(screen.getByRole('button', { name: /sign/i }));
    await waitFor(() => expect(h.signOperations).toHaveBeenCalled());
    expect(h.broadcastOperations).not.toHaveBeenCalled();
  });

  it('warns when the request acts as an account other than the selected one', async () => {
    // A transfer whose `from` is a treasury the user co-manages: without this
    // warning it reads as the user spending their own funds.
    h.splat = 'transfer';
    h.search = { from: 'treasury', to: 'attacker', amount: '10.000 HIVE' };
    render(<Sign />);
    expect(await screen.findByRole('alert')).toHaveTextContent(/@treasury/);
    expect(screen.getByRole('alert')).toHaveTextContent(/not @alice/);
  });

  it('shows no actor warning when the operation acts as the selected account', async () => {
    h.splat = 'transfer';
    h.search = { from: 'alice', to: 'bob', amount: '1.000 HIVE' };
    render(<Sign />);
    await screen.findByRole('button', { name: /approve/i });
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('resolves __signer in the rendered summary instead of showing the token', async () => {
    // No `from` given: the schema defaults it to __signer.
    h.splat = 'transfer';
    h.search = { to: 'bob', amount: '2.000 HIVE' };
    render(<Sign />);
    await screen.findByRole('button', { name: /approve/i });
    expect(document.body.textContent).not.toContain('__signer');
    expect(document.body.textContent).toContain('@alice');
  });

  it('blocks approval of an HP request until the rate has loaded', async () => {
    h.search = { to: 'bob', amount: '1 HP' };
    h.splat = 'transfer';
    h.vests = { rate: 1, ready: false }; // rate not loaded yet
    render(<Sign />);
    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
    expect(
      screen.getByText(/loading the current hive power rate/i),
    ).toBeInTheDocument();
  });
});

describe('an unknown operation', () => {
  it('shows an announced error, offers a report, and signals the op and reason', () => {
    h.splat = 'not-a-real-op';
    h.search = { foo: 'bar' };
    render(<Sign />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    // The only button is the user's Report, not an approve control.
    expect(screen.getAllByRole('button').map((b) => b.textContent)).toEqual([
      expect.stringMatching(/report/i),
    ]);
    expect(sig.report).toHaveBeenCalledWith('sign_request_invalid', {
      op: 'not-a-real-op',
      reason: 'unknown_operation',
    });
  });
});

describe('untrusted text cannot push the layout sideways', () => {
  // A real browser measurement found three overflows here: a long permlink in the
  // TITLE pushed the authority badge ~3000px off-screen, an encrypted memo (one
  // unbroken base58 run) made the page 7x the viewport, and a long custom_json
  // KEY pushed its own value out of view. jsdom cannot measure layout, so these
  // assert the wrapping classes that prevent it instead.
  const WRAPS = /\b(break-all|break-words)\b/;

  it('wraps the operation title and lets the header row wrap', async () => {
    h.splat = 'vote';
    h.search = { author: 'alice', permlink: 'a'.repeat(250), weight: '10000' };
    render(<Sign />);
    // The title is copy around the request's values (each its own element).
    const title = await screen.findByText(wholeText(/^Upvote @alice\/a+$/));
    expect(WRAPS.test(title.className), title.className).toBe(true);
    // min-w-0 is what actually lets a flex child shrink below min-content.
    expect(title.className).toContain('min-w-0');
    expect(title.parentElement?.className).toContain('flex-wrap');
  });

  it('wraps the detail line, which carries the memo', async () => {
    h.splat = 'transfer';
    h.search = { to: 'bob', amount: '1.000 HIVE', memo: `#${'A'.repeat(300)}` };
    render(<Sign />);
    const detail = await screen.findByText(wholeText(/^Memo: #A+$/));
    expect(WRAPS.test(detail.className), detail.className).toBe(true);
  });

  it('keeps a schema label whole and wraps the value beside it', async () => {
    h.splat = 'transfer';
    h.search = { from: 'treasury', to: 'bob', amount: '1.000 HIVE' };
    render(<Sign />);
    const label = await screen.findByText('From:');
    // A known label must not break letter by letter: at 320px "Permlink:"
    // rendered as P/e/r/m/l/i/n/k beside a long value when it carried break-all.
    expect(label.className).toContain('whitespace-nowrap');
    expect(label.className).toContain('shrink-0');
    const value = label.nextElementSibling as HTMLElement;
    expect(WRAPS.test(value.className), `value: ${value.className}`).toBe(true);
  });

  it('wraps a label that is a caller-chosen JSON key, so it cannot push its value off-screen', async () => {
    h.splat = 'custom_json';
    h.search = {
      id: 'x',
      required_posting_auths: '["alice"]',
      json: JSON.stringify({
        averyveryveryverylongattackerchosenkeywithoutanybreaks: 1,
      }),
    };
    render(<Sign />);
    // The raw-operation <pre> also contains the key; the row label is a span.
    const label = (await screen.findAllByText(/averyvery/)).find(
      (el) => el.tagName === 'SPAN',
    ) as HTMLElement;
    expect(label, 'row label rendered').toBeDefined();
    expect(WRAPS.test(label.className), label.className).toBe(true);
    expect(label.className).not.toContain('whitespace-nowrap');
  });
});

describe('the signing account is visible', () => {
  it('names the selected account with its avatar and a switch link carrying the request', async () => {
    h.splat = 'transfer';
    h.search = { from: 'alice', to: 'bob', amount: '1.000 HIVE' };
    render(<Sign />);
    const chip = await screen.findByTestId('current-account');
    expect(chip).toHaveTextContent(/signing as/i);
    expect(chip).toHaveTextContent('@alice');
    expect(chip.querySelector('img')).toHaveAttribute(
      'src',
      expect.stringContaining('/u/alice/avatar/'),
    );
    const link = screen.getByRole('link', { name: /switch/i });
    expect(link).toHaveAttribute('href', '/accounts');
    expect(JSON.parse(link.getAttribute('data-search') ?? '{}').next).toBe(
      window.location.pathname + window.location.search,
    );
  });

  it('calls the account "selected", not "signing", when the request needs someone else', async () => {
    h.splat = 'vote';
    h.search = {
      voter: 'bob',
      author: 'a',
      permlink: 'p',
      weight: '1',
      s: 'bob',
    };
    render(<Sign />);
    const chip = await screen.findByTestId('current-account');
    expect(chip).toHaveTextContent(/selected account/i);
    expect(chip).not.toHaveTextContent(/signing as/i);
    expect(chip).toHaveTextContent('@alice');
    // The warning still names who has to sign.
    expect(document.body.textContent).toMatch(/signed by @bob/i);
  });

  it('removes the switch link while the operation is in flight', async () => {
    h.splat = 'transfer';
    h.search = { from: 'alice', to: 'bob', amount: '1.000 HIVE' };
    let finish: (v: unknown) => void = () => {};
    h.broadcastOperations.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    const user = userEvent.setup();
    render(<Sign />);
    expect(
      await screen.findByRole('link', { name: /switch/i }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /approve/i }));
    await waitFor(() =>
      expect(screen.queryByRole('link', { name: /switch/i })).toBeNull(),
    );
    expect(screen.getByTestId('current-account')).toHaveTextContent('@alice');
    finish({ id: 'tx' });
  });

  it('names nobody when no account is selected', async () => {
    h.splat = 'transfer';
    h.search = { from: 'alice', to: 'bob', amount: '1.000 HIVE' };
    h.accounts = { selectedAccount: '', unlocked: [] } as never;
    render(<Sign />);
    await screen.findByRole('link', { name: /continue/i });
    expect(screen.queryByTestId('current-account')).toBeNull();
    h.accounts = { selectedAccount: 'alice', unlocked: ['alice'] };
  });
});

describe('the request survives import and unlock', () => {
  // A passcode user arriving from an app deep link pressed Unlock, landed on
  // the account list and the request was gone. The consent screen carried
  // `next`; the sign route did not.
  it('the unlock link carries the request as next', async () => {
    h.splat = 'transfer';
    h.search = { from: 'alice', to: 'bob', amount: '1.000 HIVE' };
    h.accounts = { selectedAccount: 'alice', unlocked: [] };
    render(<Sign />);
    const link = await screen.findByRole('link', { name: /unlock/i });
    expect(link).toHaveAttribute('href', '/accounts');
    const search = JSON.parse(link.getAttribute('data-search') ?? '{}');
    expect(search.next).toBe(window.location.pathname + window.location.search);
    h.accounts = { selectedAccount: 'alice', unlocked: ['alice'] };
  });

  it('the import link carries the request as next', async () => {
    h.splat = 'transfer';
    h.search = { from: 'alice', to: 'bob', amount: '1.000 HIVE' };
    h.accounts = { selectedAccount: '', unlocked: [] } as never;
    render(<Sign />);
    const link = await screen.findByRole('link', { name: /continue/i });
    expect(link).toHaveAttribute('href', '/import');
    expect(JSON.parse(link.getAttribute('data-search') ?? '{}')).toHaveProperty(
      'next',
    );
    h.accounts = { selectedAccount: 'alice', unlocked: ['alice'] };
  });
});

describe('a translated page', () => {
  // A page translator rewrites whatever it is not told to leave alone. The
  // request's own values are shown exactly; the copy around them is not
  // marked, so it can still be translated.
  const kept = (el: Element) =>
    Array.from(el.querySelectorAll('[translate="no"]'), (n) => n.textContent);

  it('keeps the values of a request out of translation, and the copy in it', async () => {
    h.splat = 'transfer';
    h.search = { from: 'alice', to: 'bob', amount: '1.000 HIVE', memo: 'hi' };
    render(<Sign />);
    const title = await screen.findByText(wholeText('Send 1.000 HIVE to @bob'));
    expect(title).not.toHaveAttribute('translate');
    expect(kept(title)).toEqual(['1.000 HIVE', '@bob']);
    const detail = screen.getByText(wholeText('Memo: hi'));
    expect(kept(detail)).toEqual(['hi']);
    // The schema label is copy; the account it names is not.
    const from = screen.getByText('From:');
    expect(from).not.toHaveAttribute('translate');
    expect(from.nextElementSibling).toHaveAttribute('translate', 'no');
    expect(from.nextElementSibling).toHaveTextContent('@alice');
    expect(document.querySelector('pre')).toHaveAttribute('translate', 'no');
  });

  it('lets an authority warning be translated, but not the keys beside it', async () => {
    const op = [
      'account_update',
      {
        account: 'alice',
        posting: {
          weight_threshold: 1,
          account_auths: [['app', 1]],
          key_auths: [],
        },
        memo_key: 'STM1',
        json_metadata: '',
      },
    ];
    h.splat = `op/${btoa(JSON.stringify(op)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')}`;
    h.search = {};
    render(<Sign />);
    const row = await screen.findByText(
      wholeText(
        'threshold 1; keys: NONE (your key is removed); accounts: @app (1)',
      ),
    );
    expect(row).not.toHaveAttribute('translate');
    expect(kept(row)).toEqual(['1', '@app (1)']);
  });
});

describe('in another language', () => {
  let undo = async () => {};
  afterEach(() => undo());
  const kept = (el: Element) =>
    Array.from(el.querySelectorAll('[translate="no"]'), (n) => n.textContent);

  it('reads in that language, with the request values exact and in its word order', async () => {
    undo = await installTestDictionary('fa', {
      sign: {
        confirm_transaction: 'تأیید تراکنش',
        going_redirect_to: 'به {host} هدایت می‌شوید.',
        signed_with_active: 'با کلید فعال شما امضا می‌شود',
        show_raw_one: 'نمایش عملیات خام',
      },
      summary: { transfer: '{to} ← {amount} ارسال' },
      authority: { active: 'فعال' },
    });
    h.splat = 'transfer';
    h.search = {
      from: 'alice',
      to: 'bob',
      amount: '1.000 HIVE',
      redirect_uri: 'https://app.example/done',
    };
    render(<Sign />);
    expect(
      await screen.findByRole('heading', { name: 'تأیید تراکنش' }),
    ).toBeInTheDocument();
    const title = screen.getByText(wholeText('@bob ← 1.000 HIVE ارسال'));
    expect(kept(title)).toEqual(['@bob', '1.000 HIVE']);
    const redirect = screen.getByText(
      wholeText('به app.example هدایت می‌شوید.'),
    );
    expect(redirect.querySelector('b')).toHaveAttribute('translate', 'no');
    expect(screen.getByText('فعال')).toBeInTheDocument();
    expect(screen.getByText('با کلید فعال شما امضا می‌شود')).toBeInTheDocument();
    expect(screen.getByText('نمایش عملیات خام')).toBeInTheDocument();
  });

  it('counts operations with the plural form the language needs', async () => {
    undo = await installTestDictionary('ru', {
      sign: {
        contains_operations_one: '{count} операция',
        contains_operations_few: '{count} операции',
        contains_operations_many: '{count} операций',
        show_raw_few: 'Показать операции',
      },
    });
    const vote = [
      'vote',
      { voter: 'alice', author: 'a', permlink: 'p', weight: 100 },
    ];
    h.splat = `ops/${btoa(JSON.stringify([vote, vote, vote]))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')}`;
    h.search = {};
    render(<Sign />);
    expect(await screen.findByText('3 операции')).toBeInTheDocument();
    expect(screen.getByText('Показать операции')).toBeInTheDocument();
  });
});
