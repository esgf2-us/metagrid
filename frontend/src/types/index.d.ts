export {};

declare global {
  interface Window {
    REACT_APP_METAGRID_API_URL: string;
    REACT_APP_WGET_API_URL: string;
    REACT_APP_ESGF_NODE_URL: string;
    REACT_APP_ESGF_NODE_STATUS_URL: string;
    REACT_APP_KEYCLOAK_REALM: string;
    REACT_APP_KEYCLOAK_URL: string;
    REACT_APP_KEYCLOAK_CLIENT_ID: string;
    REACT_APP_HOTJAR_ID: string;
    REACT_APP_HOTJAR_SV: string;
  }
}