import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AppHeader } from './AppHeader';

describe('AppHeader', () => {
  it('shows the domain cue so the real site is recognizable', () => {
    render(<AppHeader />);
    expect(screen.getByText('Hivesigner')).toBeInTheDocument();
    expect(screen.getByText('hivesigner.com')).toBeInTheDocument();
  });
});
