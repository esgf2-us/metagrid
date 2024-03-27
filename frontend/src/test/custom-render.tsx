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
import { publicUrl } from '../env';
import { RawUserAuth, RawUserInfo } from '../contexts/types';

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const keycloak = new Keycloak();

/**
 * Wraps components in all implemented React Context Providers for testing using keycloak
 * https://testing-library.com/docs/react-testing-library/setup#custom-render
 */

export const KeycloakProvider = ({
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
};

const customRenderKeycloak = (
  ui: React.ReactElement,
  options?: Record<string, unknown>,
  authenticated = true,
  snapshotFunc?: ((mutableSnapshot: MutableSnapshot) => void) | undefined
): RenderResult => {
  return render(ui, {
    wrapper: () => (
      <KeycloakProvider
        authenticated={authenticated}
        snapshotSetFunc={snapshotFunc}
      >
        {ui}
      </KeycloakProvider>
    ),
    ...options,
  });
};

/**
 * Wraps components in all implemented React Context Providers for testing using keycloak
 * https://testing-library.com/docs/react-testing-library/setup#custom-render
 */
const GlobusProviders = ({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement => {
  return (
    <RecoilRoot>
      <GlobusAuthProvider>
        <MemoryRouter basename={process.env.PUBLIC_URL}>
          <ReactJoyrideProvider>{children}</ReactJoyrideProvider>
        </MemoryRouter>
      </GlobusAuthProvider>
    </RecoilRoot>
  );
};

const customRenderGlobus = (
  ui: React.ReactElement,
  options?: Record<string, unknown>
): RenderResult => render(ui, { wrapper: GlobusProviders, ...options });

export { customRenderGlobus, customRenderKeycloak };
