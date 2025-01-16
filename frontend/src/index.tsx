import React from 'react';
import { createRoot } from 'react-dom/client';
import { RecoilRoot } from 'recoil';
import { ReactKeycloakProvider } from '@react-keycloak/web';
import { BrowserRouter } from 'react-router-dom';
import ReactGA from 'react-ga4';
import Keycloak from 'keycloak-js';
import { getSearchFromUrl } from './common/utils';
import App from './components/App/App';
import { GlobusAuthProvider, KeycloakAuthProvider } from './contexts/AuthContext';
import { ReactJoyrideProvider } from './contexts/ReactJoyrideContext';
import './index.css';
import { FrontendConfig } from './common/types';

const container = document.getElementById('root');
const root = createRoot(container!);

const appRouter = (
  <BrowserRouter basename="/">
    <ReactJoyrideProvider>
      <App searchQuery={getSearchFromUrl()} />
    </ReactJoyrideProvider>
  </BrowserRouter>
);

fetch('/frontend-config.js')
  .then((response) => response.json() as Promise<FrontendConfig>)
  .then((response) => {
    window.METAGRID = response;

    if (window.METAGRID.GOOGLE_ANALYTICS_TRACKING_ID != null) {
      // Setup Google Analytics
      ReactGA.initialize(window.METAGRID.GOOGLE_ANALYTICS_TRACKING_ID);
    }

    const authMethod = window.METAGRID.AUTHENTICATION_METHOD;

    if (authMethod === 'keycloak') {
      // TODO: these 2 consts are duplicated from ./lib/keycloak which is now only
      // used in tests. The keycloak client needs to be created only after the
      // config is fetched from the backend above. Can they be consolidated?

      // Setup Keycloak instance as needed
      // Pass initialization options as required or leave blank to load from 'keycloak.json'
      // Source: https://github.com/panz3r/react-keycloak/blob/master/packages/web/README.md
      const keycloak = new Keycloak({
        realm: window.METAGRID.KEYCLOAK_REALM,
        url: window.METAGRID.KEYCLOAK_URL,
        clientId: window.METAGRID.KEYCLOAK_CLIENT_ID,
      });

      const keycloakProviderInitConfig = {
        onLoad: 'check-sso',
        flow: 'standard',
      };

      root.render(
        <RecoilRoot>
          <ReactKeycloakProvider authClient={keycloak} initOptions={keycloakProviderInitConfig}>
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
  });
