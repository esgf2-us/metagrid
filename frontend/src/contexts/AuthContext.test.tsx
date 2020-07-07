import React from 'react';
import { waitFor } from '@testing-library/react';

import { fetchUserAuth, AuthProvider, fetchUserInfo } from './AuthContext';
import { userAuthFixture, userInfoFixture } from '../test/fixtures';
import { apiRoutes } from '../test/server-handlers';
import { server, rest } from '../test/setup-env';
import { keycloakRender } from '../test/custom-render';

describe('test fetchUserAuth()', () => {
  it('returns user authentication tokens', async () => {
    const userAuth = await fetchUserAuth(['keycloak_token']);
    expect(userAuth).toEqual(userAuthFixture());
  });
  it('returns error', async () => {
    server.use(
      rest.post(apiRoutes.keycloakAuth, (_req, res, ctx) => {
        return res(ctx.status(404));
      })
    );
    await expect(fetchUserAuth(['keycloak_token'])).rejects.toThrow('404');
  });
});

describe('test fetchUserInfo()', () => {
  it('returns user info', async () => {
    const userInfo = await fetchUserInfo(['access_token']);
    expect(userInfo).toEqual(userInfoFixture());
  });
  it('returns error', async () => {
    server.use(
      rest.get(apiRoutes.userInfo, (_req, res, ctx) => {
        return res(ctx.status(404));
      })
    );
    await expect(fetchUserInfo(['access_token'])).rejects.toThrow('404');
  });
});
describe('test AuthProvider', () => {
  it('renders using keycloak provider', async () => {
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
  });
});
