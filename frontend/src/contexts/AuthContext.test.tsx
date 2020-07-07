import React from 'react';

import { fetchUser, AuthProvider } from './AuthContext';
import { userAuthFixture } from '../test/fixtures';
import { apiRoutes } from '../test/server-handlers';
import { server, rest } from '../test/setup-env';
import { keycloakRender } from '../test/custom-render';

describe('test getUser()', () => {
  it('returns user authentication tokens', async () => {
    const userAuth = await fetchUser(['keycloak_token']);
    expect(userAuth).toEqual({ results: userAuthFixture() });
  });
  it('returns error', async () => {
    server.use(
      rest.post(apiRoutes.keycloakAuth, (_req, res, ctx) => {
        return res(ctx.status(404));
      })
    );
    await expect(fetchUser(['keycloak_token'])).rejects.toThrow('404');
  });
});

describe('test AuthProvider', () => {
  it('renders using keycloak provider', () => {
    const { getByText } = keycloakRender(
      <AuthProvider>
        <p>renders</p>
      </AuthProvider>,
      { token: 'token' }
    );
    expect(getByText('renders')).toBeTruthy();
  });
});
