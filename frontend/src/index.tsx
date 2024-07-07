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
import './index.css';

const container = document.getElementById('root');
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const root = createRoot(container!);

// Setup Google Analytics

// Set initial gtag/js?id=<first ID> script to <head>
const gaScript = document.createElement('script');
gaScript.type = 'text/javascript';
gaScript.async = true;
gaScript.src = `//www.googletagmanager.com/gtag/js?id=${window.METAGRID.REACT_APP_GOOGLE_ANALYTICS_TRACKING_ID}`;
document.getElementsByTagName('head')[0].appendChild(gaScript);

window.dataLayer = [];
const gtag: Gtag.Gtag = function gtag(...args) {
  window.dataLayer.push(args);
};
window.gtag = gtag;
window.gtag('js', new Date());
window.gtag('config', window.METAGRID.REACT_APP_GOOGLE_ANALYTICS_TRACKING_ID);

const appRouter = (
  <BrowserRouter basename={process.env.PUBLIC_URL}>
    <ReactJoyrideProvider>
      <App searchQuery={getSearchFromUrl()} />
    </ReactJoyrideProvider>
  </BrowserRouter>
);

if (window.METAGRID.REACT_APP_AUTHENTICATION_METHOD === 'keycloak') {
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
