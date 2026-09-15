import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import '../i18n';

// Mimics TanStack Router: activeProps.className is APPENDED to the element's
// own className, it does not replace it. That detail is the whole bug below.
vi.mock('@tanstack/react-router', () => ({
  Link: ({
    children,
    to,
    className,
    activeProps,
  }: {
    children: unknown;
    to: string;
    className?: string;
    activeProps?: { className?: string };
  }) => {
    // Pretend /apps is the current route.
    const active = to === '/apps';
    const cls =
      active && activeProps?.className
        ? `${className ?? ''} ${activeProps.className}`
        : (className ?? '');
    return (
      <a href={to} className={cls} data-active={active ? 'true' : undefined}>
        {children as never}
      </a>
    );
  },
}));

import { AppNav } from './AppNav';

describe('AppNav', () => {
  it('offers every destination', () => {
    render(<AppNav />);
    const labels = screen.getAllByRole('link').map((a) => a.textContent);
    expect(labels).toHaveLength(6);
  });

  // The active item had NO underline at all in production. Two things caused
  // it, and both are pinned here:
  //
  //  1. activeProps repeated the whole base class string, so the element
  //     carried `border-transparent` twice;
  //  2. `border-brand` and `border-transparent` are both border-colour
  //     utilities of equal specificity, so Tailwind resolves them by EMIT
  //     ORDER in the stylesheet, not by their order in the attribute -
  //     transparent won. The `!` is what settles it.
  //
  // jsdom applies no stylesheet, so this asserts the class string rather than
  // a computed colour. That is the layer where both defects live.
  it('marks the active item with an underline that can actually win', () => {
    render(<AppNav />);
    const active = screen
      .getAllByRole('link')
      .find((a) => a.getAttribute('data-active') === 'true');
    expect(active, 'no active link rendered').toBeDefined();
    const cls = active?.className ?? '';

    expect(cls).toContain('border-brand!');
    // The base must not be restated: it is appended, not replaced.
    expect(
      (cls.match(/border-transparent/g) ?? []).length,
      `border-transparent appears more than once in "${cls}"`,
    ).toBeLessThanOrEqual(1);
  });

  // `overflow-x: auto` makes overflow-y compute to `auto` as well, and a single
  // pixel of vertical overhang then rendered a scrollbar down the whole bar.
  it('pins the vertical axis so a stray pixel cannot grow a scrollbar', () => {
    render(<AppNav />);
    const nav = screen.getByRole('navigation');
    expect(nav.className).toContain('overflow-y-hidden');
    // No negative bottom margin on the items: that was the stray pixel.
    for (const a of screen.getAllByRole('link')) {
      expect(a.className, a.textContent ?? '').not.toMatch(/(^|\s)-mb-/);
    }
  });
});
