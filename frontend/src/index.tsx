import { ReactKeycloakProvider } from '@react-keycloak/web';
import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router } from 'react-router-dom';
import { getSearchFromUrl } from './common/utils';
import App from './components/App/App';
import { AuthProvider } from './contexts/AuthContext';
import { ReactJoyrideProvider } from './contexts/ReactJoyrideContext';
import './index.css';
import { keycloak, keycloakProviderInitConfig } from './lib/keycloak';

ReactDOM.render(
  <ReactKeycloakProvider
    authClient={keycloak}
    initOptions={keycloakProviderInitConfig}
  >
    <ReactJoyrideProvider>
      <AuthProvider>
        <Router basename={process.env.PUBLIC_URL}>
          <App searchQuery={getSearchFromUrl()} />
        </Router>
      </AuthProvider>
    </ReactJoyrideProvider>
  </ReactKeycloakProvider>,
  document.getElementById('root')
);
