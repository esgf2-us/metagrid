import React from 'react';
import ReactDOM from 'react-dom';
import { KeycloakProvider } from '@react-keycloak/web';
import { KeycloakInitOptions } from 'keycloak-js';

import App from './components/App/App';
import { keycloak, keycloakProviderInitConfig } from './keycloak';
import './index.css';
import { AuthProvider } from './contexts/AuthContext';

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
