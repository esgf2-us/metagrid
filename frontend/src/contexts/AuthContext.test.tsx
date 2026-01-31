import { screen } from '@testing-library/react';
import React from 'react';
import { vi } from 'vitest';
import customRender from '../test/custom-render';
import { mockConfig } from '../test/jestTestFunctions';

describe('test AuthProvider', () => {
  it('renders using keycloak provider', async () => {
    mockConfig.AUTHENTICATION_METHOD = 'keycloak';

    // Use real timers under Vitest to avoid fake-timer interactions with async code
    vi.useRealTimers();

    customRender(
      <div data-testid="authProvider">
        <p>renders keycloak</p>
      </div>,
    );

    // Wait for render to get user auth info
    const authProvider = await screen.findByTestId('authProvider');
    expect(authProvider).toBeTruthy();

    // Wait for re-render to get user info
    await screen.findByTestId('authProvider');

    // Check children renders
    const renderResult = await screen.findByText('renders keycloak');
    expect(renderResult).toBeTruthy();

    // previously advanced fake timers here; with real timers this is unnecessary
    await screen.findByTestId('authProvider');
  });

  it('renders using globus auth provider', async () => {
    mockConfig.AUTHENTICATION_METHOD = 'globus';

    // Use real timers under Vitest to avoid fake-timer interactions with async code
    vi.useRealTimers();

    customRender(
      <div data-testid="authProvider">
        <p>renders globus</p>
      </div>,
    );

    // Wait for render to get user auth info
    const authProvider = await screen.findByTestId('authProvider');
    expect(authProvider).toBeTruthy();

    // Wait for re-render to get user info
    await screen.findByTestId('authProvider');

    // Check children renders
    const renderResult = await screen.findByText('renders globus');
    expect(renderResult).toBeTruthy();

    // previously advanced fake timers here; with real timers this is unnecessary
    await screen.findByTestId('authProvider');
  });
});
