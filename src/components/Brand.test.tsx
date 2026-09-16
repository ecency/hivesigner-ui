import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import '../i18n';

vi.mock('@tanstack/react-router', async () =>
  (await import('../test-router-mock')).routerMock(),
);

import { Brand, BrandMark } from './Brand';

describe('Brand', () => {
  it('links home with an accessible name and the wordmark', () => {
    render(<Brand />);
    const link = screen.getByRole('link', { name: /hivesigner/i });
    expect(link).toHaveAttribute('href', '/');
    expect(link).toHaveTextContent('Hivesigner');
  });

  it('draws the mark at the requested size, hidden from assistive tech', () => {
    const { container } = render(<BrandMark size={40} />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '40');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
  });
});
