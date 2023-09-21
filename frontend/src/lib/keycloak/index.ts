import Keycloak from 'keycloak-js';
import { keycloakClientId, keycloakRealm, keycloakUrl } from '../../env';

// Setup Keycloak instance as needed
// Pass initialization options as required or leave blank to load from 'keycloak.json'
// Source: https://github.com/panz3r/react-keycloak/blob/master/packages/web/README.md
export const keycloak = Keycloak({
  realm: keycloakRealm,
  url: keycloakUrl,
  clientId: keycloakClientId,
});

export const keycloakProviderInitConfig = {
  onLoad: 'check-sso',
  flow: 'standard',
};
