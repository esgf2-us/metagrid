import { act, screen } from '@testing-library/react';
import React from 'react';
import customRender from '../test/custom-render';
import { mockConfig } from '../test/jestTestFunctions';

describe('test AuthProvider', () => {
  it('renders using keycloak provider', async () => {
    mockConfig.AUTHENTICATION_METHOD = 'keycloak';

    jest.useFakeTimers();

    customRender(
      <div data-testid="authProvider">
        <p>renders keycloak</p>
      </div>
    );

    // Wait for render to get user auth info
    const authProvider = await screen.findByTestId('authProvider');
    expect(authProvider).toBeTruthy();

    // Wait for re-render to get user info
    await screen.findByTestId('authProvider');

    // Check children renders
    const renderResult = await screen.findByText('renders keycloak');
    expect(renderResult).toBeTruthy();

    jest.advanceTimersByTime(295000);

    await screen.findByTestId('authProvider');
  });

  it('renders using globus auth provider', async () => {
    mockConfig.AUTHENTICATION_METHOD = 'globus';

    jest.useFakeTimers();

    customRender(
      <div data-testid="authProvider">
        <p>renders globus</p>
      </div>
    );

    // Wait for render to get user auth info
    const authProvider = await screen.findByTestId('authProvider');
    expect(authProvider).toBeTruthy();

    // Wait for re-render to get user info
    await screen.findByTestId('authProvider');

    // Check children renders
    const renderResult = await screen.findByText('renders globus');
    expect(renderResult).toBeTruthy();

    jest.advanceTimersByTime(295000);

    await screen.findByTestId('authProvider');
  });
});
