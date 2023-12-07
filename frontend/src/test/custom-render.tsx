import { ReactKeycloakProvider } from '@react-keycloak/web';
import { render, RenderResult } from '@testing-library/react';
import Keycloak from 'keycloak-js';
import React, { ComponentType } from 'react';
import { MemoryRouter } from 'react-router-dom';

import { RecoilRoot } from 'recoil';

import {
  GlobusAuthProvider,
  KeycloakAuthProvider,
} from '../contexts/AuthContext';
import { keycloakProviderInitConfig } from '../lib/keycloak';
import { ReactJoyrideProvider } from '../contexts/ReactJoyrideContext';

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const keycloak = new Keycloak();

type AllProvidersProps = {
  children: React.ReactNode;
};
type CustomOptions = {
  authenticated?: boolean;
  idTokenParsed?: Record<string, string>;
  token?: string;
};

/**
 * Wraps components in all implemented React Context Providers for testing using keycloak
 * https://testing-library.com/docs/react-testing-library/setup#custom-render
 */
export const customRenderKeycloak = (
  ui: React.ReactElement,
  options?: CustomOptions
): RenderResult => {
  function AllProviders({ children }: AllProvidersProps): React.ReactElement {
    return (
      <RecoilRoot>
        <ReactKeycloakProvider
          authClient={keycloak}
          initOptions={keycloakProviderInitConfig}
        >
          <KeycloakAuthProvider>
            <MemoryRouter basename={process.env.PUBLIC_URL}>
              <ReactJoyrideProvider>{children}</ReactJoyrideProvider>
            </MemoryRouter>
          </KeycloakAuthProvider>
        </ReactKeycloakProvider>
      </RecoilRoot>
    );
  }

  return render(ui, { wrapper: AllProviders as ComponentType, ...options });
};

/**
 * Wraps components in all implemented React Context Providers for testing using keycloak
 * https://testing-library.com/docs/react-testing-library/setup#custom-render
 */
export const customRenderGlobus = (
  ui: React.ReactElement,
  options?: CustomOptions
): RenderResult => {
  function AllProviders({ children }: AllProvidersProps): React.ReactElement {
    return (
      <RecoilRoot>
        <GlobusAuthProvider>
          <MemoryRouter basename={process.env.PUBLIC_URL}>
            <ReactJoyrideProvider>{children}</ReactJoyrideProvider>
          </MemoryRouter>
        </GlobusAuthProvider>
      </RecoilRoot>
    );
  }

  return render(ui, { wrapper: AllProviders as ComponentType, ...options });
};
