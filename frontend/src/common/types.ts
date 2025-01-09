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
  AUTHENTICATION_METHOD: 'keycloak' | 'globus';
  GOOGLE_ANALYTICS_TRACKING_ID: string | null;

  // Globus
  GLOBUS_NODES: string[];
  GLOBUS_CLIENT_ID: string;
  GLOBUS_REDIRECT: string;

  // Keycloak
  KEYCLOAK_REALM: string;
  KEYCLOAK_URL: string;
  KEYCLOAK_CLIENT_ID: string;

  // HotJar
  HOTJAR_ID: number | null;
  HOTJAR_SV: number | null;
};
