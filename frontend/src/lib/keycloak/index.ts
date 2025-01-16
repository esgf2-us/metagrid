import Keycloak from 'keycloak-js';

// Setup Keycloak instance as needed
// Pass initialization options as required or leave blank to load from 'keycloak.json'
// Source: https://github.com/panz3r/react-keycloak/blob/master/packages/web/README.md
export const keycloak = new Keycloak({
  realm: window.METAGRID.KEYCLOAK_REALM,
  url: window.METAGRID.KEYCLOAK_URL,
  clientId: window.METAGRID.KEYCLOAK_CLIENT_ID,
});

export const keycloakProviderInitConfig = {
  onLoad: 'check-sso',
  flow: 'standard',
};
