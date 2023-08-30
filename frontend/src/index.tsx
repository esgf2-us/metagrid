import React from 'react';
import { createRoot } from 'react-dom/client';
import { RecoilRoot } from 'recoil';
import { ReactKeycloakProvider } from '@react-keycloak/web';
import { BrowserRouter } from 'react-router-dom';
import { getSearchFromUrl } from './common/utils';
import App from './components/App/App';
import { AuthProvider } from './contexts/AuthContext';
import { ReactJoyrideProvider } from './contexts/ReactJoyrideContext';
import './index.css';
import { keycloak, keycloakProviderInitConfig } from './lib/keycloak';

const container = document.getElementById('root');
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const root = createRoot(container!);

root.render(
  <RecoilRoot>
    <ReactKeycloakProvider
      authClient={keycloak}
      initOptions={keycloakProviderInitConfig}
    >
      <AuthProvider>
        <BrowserRouter basename={process.env.PUBLIC_URL}>
          <ReactJoyrideProvider>
            <App searchQuery={getSearchFromUrl()} />
          </ReactJoyrideProvider>
        </BrowserRouter>
      </AuthProvider>
    </ReactKeycloakProvider>
  </RecoilRoot>
);
