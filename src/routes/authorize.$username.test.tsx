import { render, screen } from '@testing-library/react';
import type { ComponentType } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { routerState } from '../test-router-mock';

vi.mock('@tanstack/react-router', async () =>
  (await import('../test-router-mock')).routerMock(),
);
// The routes are thin: they exist to turn the URL into GrantAction props.
vi.mock('@/components/GrantAction', () => ({
  GrantAction: (props: Record<string, unknown>) => (
    <div data-testid="grant" data-props={JSON.stringify(props)} />
  ),
}));

import { Route as AuthorizeRoute } from './authorize.$username';
import { Route as RevokeRoute } from './revoke.$username';

const Authorize = (AuthorizeRoute as unknown as { component: ComponentType })
  .component;
const Revoke = (RevokeRoute as unknown as { component: ComponentType })
  .component;

function props() {
  return JSON.parse(
    screen.getByTestId('grant').getAttribute('data-props') ?? '{}',
  );
}

describe('/authorize/:username and /revoke/:username', () => {
  it('strips a leading @ from the app name and passes the mode', () => {
    routerState.params = { username: '@ecency.app' };
    routerState.search = {};
    render(<Authorize />);
    expect(props()).toMatchObject({ appName: 'ecency.app', mode: 'grant' });
  });

  it('renders the revoke mode for /revoke/:username', () => {
    routerState.params = { username: 'ecency.app' };
    routerState.search = {};
    render(<Revoke />);
    expect(props()).toMatchObject({ appName: 'ecency.app', mode: 'revoke' });
  });
});
