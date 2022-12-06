import React from 'react';
import { ReactKeycloakProvider } from '@react-keycloak/web';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router } from 'react-router-dom';
import { CompatRouter } from 'react-router-dom-v5-compat';
import { getSearchFromUrl } from './common/utils';
import App from './components/App/App';
import { AuthProvider } from './contexts/AuthContext';
import { ReactJoyrideProvider } from './contexts/ReactJoyrideContext';
import './index.css';
import { keycloak, keycloakProviderInitConfig } from './lib/keycloak';
import { ModalProvider } from './contexts/ModalContext';

ReactDOM.render(
  <ReactKeycloakProvider
    authClient={keycloak}
    initOptions={keycloakProviderInitConfig}
  >
    <AuthProvider>
      <Router basename={process.env.PUBLIC_URL}>
        <CompatRouter>
          <ReactJoyrideProvider>
            <ModalProvider>
              <App searchQuery={getSearchFromUrl()} />
            </ModalProvider>
          </ReactJoyrideProvider>
        </CompatRouter>
      </Router>
    </AuthProvider>
  </ReactKeycloakProvider>,
  document.getElementById('root')
);
