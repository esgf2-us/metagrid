import React from 'react';
import { ReactKeycloakProvider } from '@react-keycloak/web';
import ReactDOM from 'react-dom';
import { BrowserRouter } from 'react-router-dom';
import { getSearchFromUrl } from './common/utils';
import App from './components/App/App';
import {
  GlobusAuthProvider,
  KeycloakAuthProvider,
} from './contexts/AuthContext';
import { ReactJoyrideProvider } from './contexts/ReactJoyrideContext';
import { keycloak, keycloakProviderInitConfig } from './lib/keycloak';
import { authenticationMethod } from './env';
import './index.css';

const appRouter = (
  <BrowserRouter basename={process.env.PUBLIC_URL}>
    <ReactJoyrideProvider>
      <App searchQuery={getSearchFromUrl()} />
    </ReactJoyrideProvider>
  </BrowserRouter>
);

if (authenticationMethod === 'keycloak') {
  ReactDOM.render(
    <ReactKeycloakProvider
      authClient={keycloak}
      initOptions={keycloakProviderInitConfig}
    >
      <KeycloakAuthProvider>{appRouter}</KeycloakAuthProvider>
    </ReactKeycloakProvider>,
    document.getElementById('root')
  );
} else {
  ReactDOM.render(
    <GlobusAuthProvider>{appRouter}</GlobusAuthProvider>,
    document.getElementById('root')
  );
}
