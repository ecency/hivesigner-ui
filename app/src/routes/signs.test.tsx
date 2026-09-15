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
      screen.getByPlaceholderText(/type name of transaction/i),
      'zzzznope',
    );
    expect(screen.queryByText(/^Transfer$/)).toBeNull();
    expect(screen.getByText(/nothing matches/i)).toBeInTheDocument();
  });

  it('filters by the authority an operation needs', async () => {
    const user = userEvent.setup();
    render(<Signs />);
    await user.type(
      screen.getByPlaceholderText(/type name of transaction/i),
      'owner',
    );
    // change_recovery_account is the owner-authority op in the schema.
    expect(screen.getAllByText(/owner/i).length).toBeGreaterThan(0);
  });

  it('hands a built operation to /sign/op rather than signing here', async () => {
    const user = userEvent.setup();
    render(<Signs />);
    await user.type(
      screen.getByPlaceholderText(/type name of transaction/i),
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
