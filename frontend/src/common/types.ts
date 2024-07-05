export type CSSinJS = {
  [key: string]: React.CSSProperties | { [key: string]: React.CSSProperties };
};

export enum AppPage {
  'Main',
  'Cart',
  'SavedSearches',
  'NodeStatus',
}

export type FrontendConfig = {
  // General
  REACT_APP_AUTHENTICATION_METHOD: 'keycloak' | 'globus';
  REACT_APP_GOOGLE_ANALYTICS_TRACKING_ID: string;

  // Globus
  REACT_APP_GLOBUS_NODES: string[];
  REACT_APP_GLOBUS_CLIENT_ID: string;

  // Keycloak
  REACT_APP_KEYCLOAK_REALM: string;
  REACT_APP_KEYCLOAK_URL: string;
  REACT_APP_KEYCLOAK_CLIENT_ID: string;

  // HotJar
  REACT_APP_HOTJAR_ID?: number;
  REACT_APP_HOTJAR_SV?: number;
};
