import { KeycloakProvider } from '@react-keycloak/web';
import { KeycloakInitOptions } from 'keycloak-js';
import React from 'react';
import ReactDOM from 'react-dom';
import App from './components/App/App';
import { AuthProvider } from './contexts/AuthContext';
import './index.css';
import { keycloak, keycloakProviderInitConfig } from './keycloak';

ReactDOM.render(
  <KeycloakProvider
    keycloak={keycloak}
    initConfig={keycloakProviderInitConfig as KeycloakInitOptions}
  >
    <AuthProvider>
      <App />
    </AuthProvider>
  </KeycloakProvider>,
  document.getElementById('root')
);
