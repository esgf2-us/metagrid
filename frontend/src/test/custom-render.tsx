import { ReactKeycloakProvider } from '@react-keycloak/web';
import { render, RenderResult } from '@testing-library/react';
import Keycloak from 'keycloak-js';
import React, { ComponentType } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { RecoilRoot } from 'recoil';
import { AuthProvider } from '../contexts/AuthContext';
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
 * Wraps components in the Keycloak Provider for testing
 * https://testing-library.com/docs/example-react-context/
 */
export const keycloakRender = (
  ui: React.ReactElement
  // options?: CustomOptions
): RenderResult =>
  render(
    <ReactKeycloakProvider
      // authClient={{ ...createKeycloakStub(), ...options }}
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      authClient={keycloak}
      initOptions={keycloakProviderInitConfig}
    >
      {ui}
    </ReactKeycloakProvider>
  );

/**
 * Wraps components in all implemented React Context Providers for testing
 * https://testing-library.com/docs/react-testing-library/setup#custom-render
 */
export const customRender = (
  ui: React.ReactElement,
  options?: CustomOptions
): RenderResult => {
  function AllProviders({ children }: AllProvidersProps): React.ReactElement {
    return (
      <RecoilRoot>
        <ReactKeycloakProvider
          // authClient={{ ...createKeycloakStub(), ...options }}
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          authClient={keycloak}
          initOptions={keycloakProviderInitConfig}
        >
          <AuthProvider>
            <MemoryRouter basename={process.env.PUBLIC_URL}>
              <ReactJoyrideProvider>{children}</ReactJoyrideProvider>
            </MemoryRouter>
          </AuthProvider>
        </ReactKeycloakProvider>
      </RecoilRoot>
    );
  }

  return render(ui, { wrapper: AllProviders as ComponentType, ...options });
};
