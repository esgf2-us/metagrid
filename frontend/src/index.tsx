import { KeycloakProvider } from '@react-keycloak/web';
import { KeycloakInitOptions } from 'keycloak-js';
import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router } from 'react-router-dom';
import App from './components/App/App';
import { AuthProvider } from './contexts/AuthContext';
import './index.css';
import { keycloak, keycloakProviderInitConfig } from './lib/keycloak';

ReactDOM.render(
  <KeycloakProvider
    keycloak={keycloak}
    initConfig={keycloakProviderInitConfig as KeycloakInitOptions}
  >
    <AuthProvider>
      <Router basename={process.env.PUBLIC_URL}>
        <App />
      </Router>
    </AuthProvider>
  </KeycloakProvider>,
  document.getElementById('root')
);
