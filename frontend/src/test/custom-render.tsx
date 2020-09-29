import { KeycloakProvider } from '@react-keycloak/web';
import { render, RenderResult } from '@testing-library/react';
import { KeycloakInstance } from 'keycloak-js';
import React, { ComponentType } from 'react';
import { AuthProvider } from '../contexts/AuthContext';

const keycloak: KeycloakInstance = {
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
  init: jest.fn().mockImplementation(() => Promise.resolve({})),
  loadUserInfo: jest.fn(),
  loadUserProfile: jest.fn(),
  login: jest.fn(),
  logout: jest.fn(),
  register: jest.fn(),
  updateToken: jest.fn(),
};

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
 * https://testing-library.com/docs/react-testing-library/setup#custom-render
 */
export const keycloakRender = (
  ui: React.ReactElement,
  options?: CustomOptions
): RenderResult => {
  function AllProviders({ children }: AllProvidersProps): React.ReactElement {
    return (
      <KeycloakProvider keycloak={{ ...keycloak, ...options }}>
        {children}
      </KeycloakProvider>
    );
  }

  return render(ui, { wrapper: AllProviders as ComponentType, ...options });
};

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
      <KeycloakProvider keycloak={{ ...keycloak, ...options }}>
        <AuthProvider>{children}</AuthProvider>
      </KeycloakProvider>
    );
  }

  return render(ui, { wrapper: AllProviders as ComponentType, ...options });
};
