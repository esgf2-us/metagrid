import React from 'react';
import { createRoot } from 'react-dom/client';
import { RecoilRoot } from 'recoil';
import { ReactKeycloakProvider } from '@react-keycloak/web';
import { BrowserRouter } from 'react-router-dom';
import { getSearchFromUrl } from './common/utils';
import App from './components/App/App';
import {
  GlobusAuthProvider,
  KeycloakAuthProvider,
} from './contexts/AuthContext';
import { ReactJoyrideProvider } from './contexts/ReactJoyrideContext';
import { keycloak, keycloakProviderInitConfig } from './lib/keycloak';
import { authenticationMethod, publicUrl } from './env';
import './index.css';

const container = document.getElementById('root');
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const root = createRoot(container!);

const appRouter = (
  <BrowserRouter basename={publicUrl}>
    <ReactJoyrideProvider>
      <App searchQuery={getSearchFromUrl()} />
    </ReactJoyrideProvider>
  </BrowserRouter>
);

if (authenticationMethod === 'keycloak') {
  root.render(
    <RecoilRoot>
      <ReactKeycloakProvider
        authClient={keycloak}
        initOptions={keycloakProviderInitConfig}
      >
        <KeycloakAuthProvider>{appRouter}</KeycloakAuthProvider>
      </ReactKeycloakProvider>
    </RecoilRoot>
  );
} else {
  root.render(
    <RecoilRoot>
      <GlobusAuthProvider>{appRouter}</GlobusAuthProvider>
    </RecoilRoot>
  );
}
