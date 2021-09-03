import { ReactKeycloakProvider } from '@react-keycloak/web';
import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router } from 'react-router-dom';
import { getSearchFromUrl } from './common/utils';
import App from './components/App/App';
import { ActiveSearchQuery } from './components/Search/types';
import { AuthProvider } from './contexts/AuthContext';
import './index.css';
import { keycloak, keycloakProviderInitConfig } from './lib/keycloak';

const search: ActiveSearchQuery = getSearchFromUrl();

ReactDOM.render(
  <ReactKeycloakProvider
    authClient={keycloak}
    initOptions={keycloakProviderInitConfig}
  >
    <AuthProvider>
      <Router basename={process.env.PUBLIC_URL}>
        <App searchQuery={search} />
      </Router>
    </AuthProvider>
  </ReactKeycloakProvider>,
  document.getElementById('root')
);
