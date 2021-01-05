import { act, waitFor } from '@testing-library/react';
import React from 'react';
import { keycloakRender } from '../test/custom-render';
import { AuthProvider } from './AuthContext';

describe('test AuthProvider', () => {
  it('renders using keycloak provider', async () => {
    jest.useFakeTimers();

    const { getByTestId, getByText } = keycloakRender(
      <AuthProvider>
        <div data-testid="authProvider">
          <p>renders</p>
        </div>
      </AuthProvider>,
      { token: 'token' }
    );

    // Wait for render to get user auth info
    const authProvider = await waitFor(() => getByTestId('authProvider'));
    expect(authProvider).toBeTruthy();

    // Wait for re-render to get user info
    await waitFor(() => getByTestId('authProvider'));

    // Check children renders
    const renderResult = await waitFor(() => getByText('renders'));
    expect(renderResult).toBeTruthy();

    act(() => {
      jest.advanceTimersByTime(295000);
    });

    await waitFor(() => getByTestId('authProvider'));
  });
});
