import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentType } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import '../i18n';

// /signs is a contract route: it filters the operation schema and hands a built
// request to the /sign confirm screen rather than signing anything itself.
const h = vi.hoisted(() => ({ navigate: vi.fn() }));

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (opts: unknown) => opts,
  Link: ({ children }: { children: unknown }) => children,
  useNavigate: () => h.navigate,
}));

import { Route } from './signs';

const Signs = (Route as unknown as { component: ComponentType }).component;

beforeEach(() => {
  h.navigate.mockReset();
});

describe('/signs', () => {
  it('lists operations and filters by name', async () => {
    const user = userEvent.setup();
    render(<Signs />);
    expect(screen.getAllByText(/transfer/i).length).toBeGreaterThan(0);
    await user.type(
      screen.getByPlaceholderText(/search operations/i),
      'zzzznope',
    );
    expect(screen.queryByText(/^Transfer$/)).toBeNull();
    expect(screen.getByText(/nothing matches/i)).toBeInTheDocument();
  });

  it('filters by the authority an operation needs', async () => {
    const user = userEvent.setup();
    render(<Signs />);
    await user.type(screen.getByPlaceholderText(/search operations/i), 'owner');
    // change_recovery_account is the owner-authority op in the schema.
    expect(screen.getAllByText(/owner/i).length).toBeGreaterThan(0);
  });

  it('hands a built operation to /sign/op rather than signing here', async () => {
    const user = userEvent.setup();
    render(<Signs />);
    await user.type(
      screen.getByPlaceholderText(/search operations/i),
      'redeem',
    );
    // Open the first matching operation and submit it.
    const summary = screen.getAllByText(/redeem rewards/i)[0];
    await user.click(summary);
    await user.click(screen.getAllByRole('button', { name: /^sign$/i })[0]);
    expect(h.navigate).toHaveBeenCalledTimes(1);
    const to = h.navigate.mock.calls[0][0].to as string;
    // Never a bare hive:// URI, and never a second signing path.
    expect(to.startsWith('/sign/op/')).toBe(true);
    expect(to).not.toContain('hive://');
  });
});

describe('/signs structured fields', () => {
  /** Decode what the page handed to /sign/op/<b64>. */
  async function decodeHandoff(to: string) {
    const { decode } = await import('@/lib/hive-uri');
    return decode(`hive://${to.replace(/^\//, '')}`);
  }

  it('keeps an array default an ARRAY, not the bare string String() makes', async () => {
    // custom_json.required_posting_auths defaults to ['__signer']; String() on
    // that yields "__signer", so the operation left here with a string where the
    // chain expects a list.
    const user = userEvent.setup();
    render(<Signs />);
    await user.type(
      screen.getByPlaceholderText(/search operations/i),
      'custom operation',
    );
    await user.click(screen.getAllByText(/custom operation/i)[0]);
    await user.click(screen.getAllByRole('button', { name: /^sign$/i })[0]);
    const decoded = await decodeHandoff(h.navigate.mock.calls[0][0].to);
    const payload = decoded.tx.operations[0][1] as Record<string, unknown>;
    expect(Array.isArray(payload.required_posting_auths)).toBe(true);
    expect(payload.required_posting_auths).toEqual(['__signer']);
    expect(Array.isArray(payload.required_auths)).toBe(true);
  });

  it('keeps an object default an OBJECT, not "[object Object]"', async () => {
    const user = userEvent.setup();
    render(<Signs />);
    await user.type(
      screen.getByPlaceholderText(/search operations/i),
      'witness update',
    );
    await user.click(screen.getAllByText(/witness update/i)[0]);
    await user.click(screen.getAllByRole('button', { name: /^sign$/i })[0]);
    const decoded = await decodeHandoff(h.navigate.mock.calls[0][0].to);
    const payload = decoded.tx.operations[0][1] as Record<string, unknown>;
    expect(typeof payload.props).toBe('object');
    expect(payload.props).not.toBe('[object Object]');
    expect((payload.props as Record<string, unknown>).maximum_block_size).toBe(
      131072,
    );
  });

  it('refuses to encode invalid JSON in a structured field', async () => {
    const user = userEvent.setup();
    render(<Signs />);
    await user.type(
      screen.getByPlaceholderText(/search operations/i),
      'custom operation',
    );
    await user.click(screen.getAllByText(/custom operation/i)[0]);
    const boxes = screen.getAllByRole('textbox');
    const jsonBox = boxes.find(
      (b) => b.tagName === 'TEXTAREA',
    ) as HTMLTextAreaElement;
    await user.clear(jsonBox);
    // `{{` types a literal '{': userEvent reads a bare '{' as a key descriptor.
    await user.type(jsonBox, 'not json {{');
    await user.click(screen.getAllByRole('button', { name: /^sign$/i })[0]);
    expect(await screen.findByRole('alert')).toHaveTextContent(/valid JSON/i);
    expect(h.navigate).not.toHaveBeenCalled();
  });
});

describe('/signs schema-type fidelity', () => {
  async function decodeHandoff(to: string) {
    const { decode } = await import('@/lib/hive-uri');
    return decode(`hive://${to.replace(/^\//, '')}`);
  }
  async function payloadFor(term: string, label: RegExp) {
    const user = userEvent.setup();
    render(<Signs />);
    await user.type(screen.getByPlaceholderText(/search operations/i), term);
    await user.click(screen.getAllByText(label)[0]);
    return { user };
  }

  it('keeps a json-typed field a STRING, since that is its on-chain type', async () => {
    // custom_json.json carries a JSON string. Parsing it would make the
    // serializer write an object where the caller asked for a string.
    const { user } = await payloadFor('custom operation', /custom operation/i);
    const boxes = screen
      .getAllByRole('textbox')
      .filter((b) => b.tagName === 'TEXTAREA') as HTMLTextAreaElement[];
    // The json field is the one whose label ends with "json (JSON)".
    const jsonBox = boxes.find((b) => b.id.endsWith('-json')) as HTMLElement;
    // `{{` types a literal '{' (userEvent reads a bare '{' as a key descriptor).
    await user.type(jsonBox, '{{"follow":1}');
    await user.click(screen.getAllByRole('button', { name: /^sign$/i })[0]);
    const decoded = await decodeHandoff(h.navigate.mock.calls[0][0].to);
    const payload = decoded.tx.operations[0][1] as Record<string, unknown>;
    expect(typeof payload.json).toBe('string');
    expect(payload.json).toBe('{"follow":1}');
  });

  it('omits a blank optional authority instead of sending {}', async () => {
    // account_update's owner/active/posting are optional objects. Sending {}
    // made operationAuthority's present() check true, escalating the request to
    // the OWNER key and shipping an authority with no threshold or auths.
    await payloadFor('update account (active)', /^Update account \(active\)$/);
    await userEvent.click(
      screen.getAllByRole('button', { name: /^sign$/i })[0],
    );
    const decoded = await decodeHandoff(h.navigate.mock.calls[0][0].to);
    const payload = decoded.tx.operations[0][1] as Record<string, unknown>;
    for (const role of ['owner', 'active', 'posting']) {
      expect(payload[role], `${role} must be absent, not {}`).toBeUndefined();
    }
  });

  it('a blank-authority account_update does not demand the owner key', async () => {
    const { requiredAuthority } = await import('@/lib/operation-summary');
    const { parseSignRequest } = await import('@/lib/parse-sign-request');
    await payloadFor('update account (active)', /^Update account \(active\)$/);
    await userEvent.click(
      screen.getAllByRole('button', { name: /^sign$/i })[0],
    );
    const to = h.navigate.mock.calls[0][0].to as string;
    const req = parseSignRequest(to.replace('/sign/', ''), {}, 1);
    expect(req).not.toBeNull();
    expect(requiredAuthority(req!.operations)).not.toBe('owner');
  });
});
