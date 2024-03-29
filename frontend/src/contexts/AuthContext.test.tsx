import { act, waitFor } from '@testing-library/react';
import React from 'react';
import customRender from '../test/custom-render';
import { mockConfig } from '../test/jestTestFunctions';

describe('test AuthProvider', () => {
  it('renders using keycloak provider', async () => {
    mockConfig.authenticationMethod = 'keycloak';

    jest.useFakeTimers();

    const { getByTestId, getByText } = customRender(
      <div data-testid="authProvider">
        <p>renders keycloak</p>
      </div>
    );

    // Wait for render to get user auth info
    const authProvider = await waitFor(() => getByTestId('authProvider'));
    expect(authProvider).toBeTruthy();

    // Wait for re-render to get user info
    await waitFor(() => getByTestId('authProvider'));

    // Check children renders
    const renderResult = await waitFor(() => getByText('renders keycloak'));
    expect(renderResult).toBeTruthy();

    act(() => {
      jest.advanceTimersByTime(295000);
    });

    await waitFor(() => getByTestId('authProvider'));
  });

  it('renders using globus auth provider', async () => {
    mockConfig.authenticationMethod = 'globus';

    jest.useFakeTimers();

    const { getByTestId, getByText } = customRender(
      <div data-testid="authProvider">
        <p>renders globus</p>
      </div>
    );

    // Wait for render to get user auth info
    const authProvider = await waitFor(() => getByTestId('authProvider'));
    expect(authProvider).toBeTruthy();

    // Wait for re-render to get user info
    await waitFor(() => getByTestId('authProvider'));

    // Check children renders
    const renderResult = await waitFor(() => getByText('renders globus'));
    expect(renderResult).toBeTruthy();

    act(() => {
      jest.advanceTimersByTime(295000);
    });

    await waitFor(() => getByTestId('authProvider'));
  });
});
