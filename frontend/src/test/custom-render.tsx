import { ReactKeycloakProvider } from '@react-keycloak/web';
import { render, RenderResult } from '@testing-library/react';
import Keycloak from 'keycloak-js';
import React from 'react';

import { RecoilRoot } from 'recoil';

import { AuthContext } from '../contexts/AuthContext';
import {
  GlobusAuthProvider,
  KeycloakAuthProvider,
} from '../contexts/AuthContext';
import { keycloakProviderInitConfig } from '../lib/keycloak';
import { MemoryRouter } from 'react-router-dom';
import { ReactJoyrideProvider } from '../contexts/ReactJoyrideContext';
import { useKeycloak } from '@react-keycloak/web';

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const keycloak = new Keycloak();

type CustomOptions = {};

/**
 * Wraps components in all implemented React Context Providers for testing using keycloak
 * https://testing-library.com/docs/react-testing-library/setup#custom-render
 */

export const KeycloakProviders = ({
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
      </ReactKeycloakProvider>
    </RecoilRoot>
  );
};

const customRenderKeycloak = (
  ui: React.ReactElement,
  options?: CustomOptions
): RenderResult => render(ui, { wrapper: KeycloakProviders, ...options });

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
  options?: CustomOptions
): RenderResult => render(ui, { wrapper: GlobusProviders, ...options });

export * from '@testing-library/react';
export { customRenderGlobus, customRenderKeycloak };
