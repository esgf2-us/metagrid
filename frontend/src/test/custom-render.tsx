import { ReactKeycloakProvider } from '@react-keycloak/web';
import { render, RenderResult } from '@testing-library/react';
import React from 'react';
import { MutableSnapshot, RecoilRoot } from 'recoil';
import { MemoryRouter } from 'react-router-dom';
import Keycloak from 'keycloak-js';
import { GlobusAuthProvider, AuthContext, KeycloakAuthProvider } from '../contexts/AuthContext';
import { ReactJoyrideProvider } from '../contexts/ReactJoyrideContext';
import { RawUserAuth, RawUserInfo } from '../contexts/types';

/**
 * Wraps components in all implemented React Context Providers for testing using keycloak or globus
 * https://testing-library.com/docs/react-testing-library/setup#custom-render
 */
const AuthProvider = ({
  children,
  authenticated,
  snapshotSetFunc,
}: {
  children: React.ReactNode;
  authenticated: boolean;
  snapshotSetFunc: ((mutableSnapshot: MutableSnapshot) => void) | undefined;
}): React.ReactElement => {
  let authInfo: RawUserAuth & RawUserInfo = {
    access_token: null,
    email: null,
    is_authenticated: false,
    refresh_token: null,
    pk: '1',
  };

  if (authenticated) {
    authInfo = {
      access_token: '1',
      email: 'email@email.com',
      is_authenticated: true,
      refresh_token: '1',
      pk: '1',
    };
  }

  if (window.METAGRID.AUTHENTICATION_METHOD === 'keycloak') {
    // Setup Keycloak instance as needed
    // Pass initialization options as required or leave blank to load from 'keycloak.json'
    // Source: https://github.com/panz3r/react-keycloak/blob/master/packages/web/README.md
    const keycloak = new Keycloak({
      realm: window.METAGRID.KEYCLOAK_REALM,
      url: window.METAGRID.KEYCLOAK_URL,
      clientId: window.METAGRID.KEYCLOAK_CLIENT_ID,
    });

    const keycloakProviderInitConfig = {
      onLoad: 'check-sso',
      flow: 'standard',
    };
    return (
      <RecoilRoot initializeState={snapshotSetFunc}>
        <ReactKeycloakProvider authClient={keycloak} initOptions={keycloakProviderInitConfig}>
          <KeycloakAuthProvider>
            <AuthContext.Provider value={authInfo}>
              <MemoryRouter>
                <ReactJoyrideProvider>{children}</ReactJoyrideProvider>
              </MemoryRouter>
            </AuthContext.Provider>
          </KeycloakAuthProvider>
        </ReactKeycloakProvider>
      </RecoilRoot>
    );
  }

  return (
    <RecoilRoot initializeState={snapshotSetFunc}>
      <GlobusAuthProvider>
        <AuthContext.Provider value={authInfo}>
          <MemoryRouter>
            <ReactJoyrideProvider>{children}</ReactJoyrideProvider>
          </MemoryRouter>
        </AuthContext.Provider>
      </GlobusAuthProvider>
    </RecoilRoot>
  );
};

const customRender = (
  ui: React.ReactElement,
  options?: Record<string, unknown>,
  authenticated = true,
  snapshotFunc?: ((mutableSnapshot: MutableSnapshot) => void) | undefined
): RenderResult =>
  render(ui, {
    wrapper: () => (
      <AuthProvider authenticated={authenticated} snapshotSetFunc={snapshotFunc}>
        {ui}
      </AuthProvider>
    ),
    ...options,
  });

export default customRender;
