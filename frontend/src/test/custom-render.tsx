import { ReactKeycloakProvider } from '@react-keycloak/web';
import { render, RenderResult } from '@testing-library/react';
import Keycloak from 'keycloak-js';
import React from 'react';
import { MutableSnapshot, RecoilRoot } from 'recoil';
import { MemoryRouter } from 'react-router-dom';
import {
  GlobusAuthProvider,
  AuthContext,
  KeycloakAuthProvider,
} from '../contexts/AuthContext';
import { keycloakProviderInitConfig } from '../lib/keycloak';
import { ReactJoyrideProvider } from '../contexts/ReactJoyrideContext';
import { authenticationMethod, publicUrl } from '../env';
import { RawUserAuth, RawUserInfo } from '../contexts/types';

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const keycloak = new Keycloak();

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

  if (authenticationMethod === 'keycloak') {
    return (
      <RecoilRoot initializeState={snapshotSetFunc}>
        <ReactKeycloakProvider
          authClient={keycloak}
          initOptions={keycloakProviderInitConfig}
        >
          <KeycloakAuthProvider>
            <AuthContext.Provider value={authInfo}>
              <MemoryRouter basename={publicUrl}>
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
          <MemoryRouter basename={process.env.PUBLIC_URL}>
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
      <AuthProvider
        authenticated={authenticated}
        snapshotSetFunc={snapshotFunc}
      >
        {ui}
      </AuthProvider>
    ),
    ...options,
  });

export default customRender;
