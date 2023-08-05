import { ReactKeycloakProvider } from '@react-keycloak/web';
import { render, RenderResult } from '@testing-library/react';
import { KeycloakInstance } from 'keycloak-js';
import React, { ComponentType } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { RecoilRoot } from 'recoil';
import { AuthProvider } from '../contexts/AuthContext';
import { keycloakProviderInitConfig } from '../lib/keycloak';
import { ReactJoyrideProvider } from '../contexts/ReactJoyrideContext';

export const createKeycloakStub = (): KeycloakInstance => ({
  // Optional
  authenticated: false,
  userInfo: {},
  // Required
  accountManagement: jest.fn(),
  clearToken: jest.fn(),
  createAccountUrl: jest.fn(),
  createLoginUrl: jest.fn(),
  createLogoutUrl: jest.fn(),
  createRegisterUrl: jest.fn(),
  isTokenExpired: jest.fn(),
  hasRealmRole: jest.fn(),
  hasResourceRole: jest.fn(),
  init: jest.fn().mockResolvedValue(true),
  loadUserInfo: jest.fn(),
  loadUserProfile: jest.fn(),
  login: jest.fn(),
  logout: jest.fn(),
  register: jest.fn(),
  updateToken: jest.fn(),
});

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
      authClient={{ ...createKeycloakStub(), ...options }}
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
          authClient={{ ...createKeycloakStub(), ...options }}
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

/**
 * Creates the appropriate name string when performing getByRole('row')
 */
export const getRowName = (
  cartButton: 'plus' | 'minus',
  nodeCircleType: 'question' | 'check' | 'close',
  title: string,
  fileCount: string,
  totalSize: string,
  version: string,
  globusReady?: boolean
): RegExp => {
  let totalBytes = `${totalSize} Bytes`;
  if (Number.isNaN(Number(totalSize))) {
    totalBytes = totalSize;
  }
  let globusReadyCheck = '.*';
  if (globusReady !== undefined) {
    globusReadyCheck = globusReadyCheck ? 'check-circle' : 'close-circle';
  }
  const newRegEx = new RegExp(
    `right-circle ${cartButton} ${nodeCircleType}-circle ${title} ${fileCount} ${totalBytes} ${version} wget download ${globusReadyCheck}`
  );

  return newRegEx;
};
