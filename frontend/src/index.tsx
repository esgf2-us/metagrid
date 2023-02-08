import React from 'react';
import { createRoot } from 'react-dom/client';
import { RecoilRoot } from 'recoil';

import { ReactKeycloakProvider } from '@react-keycloak/web';
import { BrowserRouter as Router } from 'react-router-dom';
import { getSearchFromUrl } from './common/utils';
import App from './components/App/App';
import { AuthProvider } from './contexts/AuthContext';
import { ReactJoyrideProvider } from './contexts/ReactJoyrideContext';
import './index.css';
import { keycloak, keycloakProviderInitConfig } from './lib/keycloak';

const container = document.getElementById('root');
const root = createRoot(container);
root.render(
  <RecoilRoot>
    <ReactKeycloakProvider
      authClient={keycloak}
      initOptions={keycloakProviderInitConfig}
    >
      <AuthProvider>
        <Router basename={process.env.PUBLIC_URL}>
          <ReactJoyrideProvider>
            <App searchQuery={getSearchFromUrl()} />
          </ReactJoyrideProvider>
        </Router>
      </AuthProvider>
    </ReactKeycloakProvider>
  </RecoilRoot>
);

/* ReactDOM.render(
  <RecoilRoot>
    <ReactKeycloakProvider
      authClient={keycloak}
      initOptions={keycloakProviderInitConfig}
    >
      <AuthProvider>
        <Router basename={process.env.PUBLIC_URL}>
          <ReactJoyrideProvider>
            <App searchQuery={getSearchFromUrl()} />
          </ReactJoyrideProvider>
        </Router>
      </AuthProvider>
    </ReactKeycloakProvider>
  </RecoilRoot>,
  document.getElementById('root')
);*/
