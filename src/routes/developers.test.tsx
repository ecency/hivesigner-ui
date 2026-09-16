import { render, screen } from '@testing-library/react';
import type { ComponentType } from 'react';
import { describe, expect, it, vi } from 'vitest';
import '../i18n';

vi.mock('@tanstack/react-router', async () =>
  (await import('../test-router-mock')).routerMock(),
);

import { Route } from './developers';

const Developers = (Route as unknown as { component: ComponentType }).component;

describe('/developers', () => {
  it('points at the docs and the SDK, both opened safely', () => {
    render(<Developers />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      /developers/i,
    );
    const docs = screen.getByRole('link', { name: /docs\.hivesigner\.com/ });
    expect(docs).toHaveAttribute('href', 'https://docs.hivesigner.com');
    expect(docs).toHaveAttribute('target', '_blank');
    expect(docs.getAttribute('rel')).toContain('noopener');
    expect(
      screen.getByRole('link', { name: /hivesigner\.js/ }),
    ).toHaveAttribute('href', 'https://github.com/ecency/hivesigner.js');
  });
});
