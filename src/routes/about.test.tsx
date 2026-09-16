import { render, screen } from '@testing-library/react';
import type { ComponentType } from 'react';
import { describe, expect, it, vi } from 'vitest';
import '../i18n';

vi.mock('@tanstack/react-router', async () =>
  (await import('../test-router-mock')).routerMock(),
);

import { Route } from './about';

const About = (Route as unknown as { component: ComponentType }).component;

describe('/about', () => {
  it('names the product, describes it and credits the maintainer', () => {
    render(<About />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      /About Hivesigner/,
    );
    expect(screen.getByText(/secure way to sign/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /^ecency$/i })).toHaveAttribute(
      'href',
      'https://ecency.com',
    );
  });

  it('offers the original logo file and a place to report a bug, as the previous page did', () => {
    render(<About />);
    expect(
      screen.getByRole('link', { name: /download logo/i }),
    ).toHaveAttribute('href', '/logo.svg');
    expect(
      screen.getByRole('link', { name: /report a bug/i }).getAttribute('href'),
    ).toMatch(/issues/);
  });
});
