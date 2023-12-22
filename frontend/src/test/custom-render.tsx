import { ReactKeycloakProvider } from '@react-keycloak/web';
import { render, RenderResult } from '@testing-library/react';
import Keycloak from 'keycloak-js';
import React from 'react';
import { RecoilRoot } from 'recoil';
import { MemoryRouter } from 'react-router-dom';
import {
  GlobusAuthProvider,
  AuthContext,
  KeycloakAuthProvider,
} from '../contexts/AuthContext';
import { keycloakProviderInitConfig } from '../lib/keycloak';
import { ReactJoyrideProvider } from '../contexts/ReactJoyrideContext';

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const keycloak = new Keycloak();

/**
 * Wraps components in all implemented React Context Providers for testing using keycloak
 * https://testing-library.com/docs/react-testing-library/setup#custom-render
 */

export const KeycloakProvidersAuthenticated = ({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement => {
  return (
    <RecoilRoot>
      <ReactKeycloakProvider
        authClient={keycloak}
        initOptions={keycloakProviderInitConfig}
      >
        <KeycloakAuthProvider>
          <AuthContext.Provider
            value={{
              access_token: '1',
              email: 'email@email.com',
              is_authenticated: true,
              refresh_token: '1',
              pk: '1',
            }}
          >
            <MemoryRouter basename={process.env.PUBLIC_URL}>
              <ReactJoyrideProvider>{children}</ReactJoyrideProvider>
            </MemoryRouter>
          </AuthContext.Provider>
        </KeycloakAuthProvider>
      </ReactKeycloakProvider>
    </RecoilRoot>
  );
};

export const KeycloakProvidersUnauthenticated = ({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement => {
  return (
    <RecoilRoot>
      <ReactKeycloakProvider
        authClient={keycloak}
        initOptions={keycloakProviderInitConfig}
      >
        <KeycloakAuthProvider>
          <AuthContext.Provider
            value={{
              access_token: null,
              email: null,
              is_authenticated: false,
              refresh_token: null,
              pk: '1',
            }}
          >
            <MemoryRouter basename={process.env.PUBLIC_URL}>
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
  anonymous?: boolean
): RenderResult => {
  if (anonymous) {
    return render(ui, {
      wrapper: KeycloakProvidersUnauthenticated,
      ...options,
    });
  }
  return render(ui, { wrapper: KeycloakProvidersAuthenticated, ...options });
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
