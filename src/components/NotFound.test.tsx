import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import '../i18n';

vi.mock('@tanstack/react-router', async () =>
  (await import('../test-router-mock')).routerMock(),
);

import { NotFound } from './NotFound';

describe('NotFound', () => {
  it('explains the address is wrong and offers the home page', () => {
    render(<NotFound />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      /not found/i,
    );
    expect(screen.getByRole('link', { name: /home page/i })).toHaveAttribute(
      'href',
      '/',
    );
  });
});
