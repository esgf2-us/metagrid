import React from 'react';
import { createRoot } from 'react-dom/client';
import { ReactKeycloakProvider } from '@react-keycloak/web';
import { BrowserRouter } from 'react-router';
import ReactGA from 'react-ga4';
import Keycloak, { KeycloakInitOptions } from 'keycloak-js';
import { Provider, useAtomValue } from 'jotai';
import {
  ConfigProvider,
  Layout,
  Result,
  Button,
  Breadcrumb,
  theme as antdTheme,
  Typography,
} from 'antd';
import { getSearchFromUrl, getStyle } from './common/utils';
import { isDarkModeAtom } from './common/atoms';
import App from './components/App/App';
import esgfLogo from './assets/img/esgf.png';
import startupDisplayData from './components/Messaging/messageDisplayData';
import { createCustomIcon } from './components/NavBar/index';
import { GlobusAuthProvider, KeycloakAuthProvider } from './contexts/AuthContext';
import { ReactJoyrideProvider } from './contexts/ReactJoyrideContext';
import './index.css';
import { FrontendConfig } from './common/types';

const container = document.getElementById('root');
const root = createRoot(container!);
const { Link } = Typography;
const federatedNodesUrl =
  import.meta.env.VITE_FEDERATED_NODES_URL || 'https://esgf.github.io/nodes.html';

const appRouter: JSX.Element = (
  <BrowserRouter>
    <ReactJoyrideProvider>
      <App searchQuery={getSearchFromUrl()} />
    </ReactJoyrideProvider>
  </BrowserRouter>
);

// New minimal error page component that reuses app theming/style
const ErrorPage: React.FC = () => {
  const isDarkMode = useAtomValue(isDarkModeAtom);
  const { defaultAlgorithm, darkAlgorithm } = antdTheme;
  const styles = getStyle(isDarkMode);

  const metagridVersion: string = startupDisplayData.messageToShow;

  let className = 'navbar';
  if (isDarkMode) {
    className += ' dark-mode';
  }

  return (
    <ConfigProvider
      theme={{
        token: { borderRadius: 3 },
        algorithm: isDarkMode ? darkAlgorithm : defaultAlgorithm,
      }}
    >
      <Layout>
        <nav data-testid="nav-bar" className={className}>
          <div className="navbar-container">
            <div className="navbar-logo">
              <Link
                href={federatedNodesUrl}
                target="_blank"
                style={{
                  fontWeight: 'bold',
                  fontSize: '.9em',
                }}
              >
                {createCustomIcon(esgfLogo, 'ESGF Federated Nodes', {
                  height: '82px',
                  marginLeft: '-5px',
                  marginBottom: '-30px',
                  marginTop: '-20px',
                })}
                Federated Nodes
              </Link>
            </div>
          </div>
        </nav>
        <Layout id="body-layout">
          <Layout.Sider
            style={styles.bodySider}
            width={styles.bodySider.width as number}
          ></Layout.Sider>
          <Layout.Content
            style={{
              ...styles.bodyContent,
              display: 'flex',
              flexDirection: 'column',
              minHeight: 'calc(100vh - 120px)', // ensure content area fills available height
            }}
          >
            <Breadcrumb
              items={[{ title: <span>Home</span> }, { title: <span>Service Status</span> }]}
              style={{ marginBottom: 16 }}
            />

            {/* Main message area stays at top of content column */}
            <div style={{ paddingBottom: 16 }}>
              <Result
                status="error"
                title="Service Unavailable"
                subTitle="The site is currently under maintenance or experiencing an issue. Please try again or try visiting a different federated node."
                extra={
                  <>
                    <Button type="primary" onClick={() => window.location.reload()}>
                      Retry This Page
                    </Button>

                    <Button type="primary" href={federatedNodesUrl} target="_blank">
                      Other Federated Nodes
                    </Button>
                  </>
                }
              />
            </div>
            <div
              style={{ marginTop: 'auto', textAlign: 'center', paddingTop: 12, paddingBottom: 12 }}
            >
              <footer style={{ fontSize: '11px' }}>Metagrid Version: {metagridVersion}</footer>
            </div>
          </Layout.Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
};

fetch('/frontend-config.js')
  .then((response) => {
    if (!response.ok) {
      throw new Error(
        `Failed to load configurations from backend. Check django backend logs for details. Status code: ${response.status}`,
      );
    }
    return response.json() as Promise<FrontendConfig>;
  })
  .then((response) => {
    window.METAGRID = response;

    if (window.METAGRID.GOOGLE_ANALYTICS_TRACKING_ID != null) {
      // Setup Google Analytics
      ReactGA.initialize(window.METAGRID.GOOGLE_ANALYTICS_TRACKING_ID);
    }

    const authMethod = window.METAGRID.AUTHENTICATION_METHOD;

    if (authMethod === 'keycloak') {
      // Setup Keycloak instance as needed
      // Pass initialization options as required or leave blank to load from 'keycloak.json'
      // Source: https://github.com/panz3r/react-keycloak/blob/master/packages/web/README.md
      const keycloak = new Keycloak({
        realm: window.METAGRID.KEYCLOAK_REALM,
        url: window.METAGRID.KEYCLOAK_URL,
        clientId: window.METAGRID.KEYCLOAK_CLIENT_ID,
      });

      const keycloakProviderInitConfig: KeycloakInitOptions = {
        onLoad: 'check-sso',
        flow: 'standard',
        checkLoginIframe: false,
      };

      root.render(
        <Provider>
          <ReactKeycloakProvider authClient={keycloak} initOptions={keycloakProviderInitConfig}>
            <KeycloakAuthProvider>{appRouter}</KeycloakAuthProvider>
          </ReactKeycloakProvider>
        </Provider>,
      );
    } else {
      root.render(
        <Provider>
          <GlobusAuthProvider>{appRouter}</GlobusAuthProvider>
        </Provider>,
      );
    }
  })
  .catch((error) => {
    // eslint-disable-next-line no-console
    console.error(error);

    // Render the app-styled maintenance/error page (no sidebar).
    root.render(
      <Provider>
        <ErrorPage />
      </Provider>,
    );
  });
