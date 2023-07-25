import { ReactKeycloakProvider } from '@react-keycloak/web';
import { render, RenderResult } from '@testing-library/react';
import Keycloak from 'keycloak-js';
import React, { ComponentType } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { KeycloakAuthProvider } from '../contexts/AuthContext';
import { keycloakProviderInitConfig } from '../lib/keycloak';

// @ts-ignore
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
  ui: React.ReactElement,
  options?: CustomOptions
): RenderResult =>
  render(
    <ReactKeycloakProvider
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
      <ReactKeycloakProvider
        authClient={keycloak}
        initOptions={keycloakProviderInitConfig}
      >
        <KeycloakAuthProvider>
          <MemoryRouter basename={process.env.PUBLIC_URL}>
            {children}
          </MemoryRouter>
        </KeycloakAuthProvider>
      </ReactKeycloakProvider>
    );
  }

  return render(ui, { wrapper: AllProviders as ComponentType, ...options });
};

/**
 * Creates the appropriate name string when performing getByRole('row')
 */
export const getRowName = (
  cartButton: 'plus' | 'minus',
  nodeCircleType: 'question' | 'check' | 'close',
  title: string,
  fileCount: string,
  totalSize: string,
  version: string
): string => {
  let totalBytes = `${totalSize} Bytes`;
  if (Number.isNaN(Number(totalSize))) {
    totalBytes = totalSize;
  }
  return `right-circle ${cartButton} ${nodeCircleType}-circle ${title} ${fileCount} ${totalBytes} ${version} wget download`;
};
