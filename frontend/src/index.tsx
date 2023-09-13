import React from 'react';
import { RecoilRoot } from 'recoil';
import { ReactKeycloakProvider } from '@react-keycloak/web';
import ReactDOM from 'react-dom';
import { BrowserRouter } from 'react-router-dom';
import { getSearchFromUrl } from './common/utils';
import App from './components/App/App';
import { AuthProvider } from './contexts/AuthContext';
import { ReactJoyrideProvider } from './contexts/ReactJoyrideContext';
import './index.css';
import { keycloak, keycloakProviderInitConfig } from './lib/keycloak';
import { publicUrl } from './env';

ReactDOM.render(
  <RecoilRoot>
    <ReactKeycloakProvider
      authClient={keycloak}
      initOptions={keycloakProviderInitConfig}
    >
      <AuthProvider>
        <BrowserRouter basename={publicUrl}>
          <ReactJoyrideProvider>
            <App searchQuery={getSearchFromUrl()} />
          </ReactJoyrideProvider>
        </BrowserRouter>
      </AuthProvider>
    </ReactKeycloakProvider>
  </RecoilRoot>,
  document.getElementById('root')
);
