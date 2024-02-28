/**
 * This file transforms environment variables into constants for re-usability.
 *
 * Make sure it is consistent with .envs/frontend, .react!
 */

declare global {
  interface Window {
    ENV: {
      [key: string]: string | undefined;
    };
  }
}

export function getConfig(name: string): string {
  let value = '';

  if (window && window.ENV) {
    value = window.ENV[name] || '';
  }

  if (value === '') {
    value = process.env[name] || '';
  }

  return value;
}

// MetaGrid API
// ------------------------------------------------------------------------------
// https://github.com/aims-group/metagrid/tree/master/backend
export const metagridApiURL = getConfig('REACT_APP_METAGRID_API_URL');

// Redirect frontend
export const publicUrl = getConfig('PUBLIC_URL');
export const previousPublicUrl = getConfig('REACT_APP_PREVIOUS_URL');

// Globus variables
export const globusRedirectUrl = getConfig('REACT_APP_GLOBUS_REDIRECT');
export const globusClientID = getConfig('REACT_APP_CLIENT_ID');
const globusNodesString = getConfig('REACT_APP_GLOBUS_NODES');
/* istanbul ignore next */
export const globusEnabledNodes = globusNodesString
  ? globusNodesString.split(',')
  : [];

// ESGF wget API
// ------------------------------------------------------------------------------
// https://github.com/ESGF/esgf-wget
export const wgetApiURL = getConfig('REACT_APP_WGET_API_URL');

// ESGF Search API
// ------------------------------------------------------------------------------
// https://esgf.github.io/esg-search/ESGF_Search_RESTful_API.html
export const esgfSearchURL = getConfig('REACT_APP_SEARCH_URL');

// ESGF Node Status API
// ------------------------------------------------------------------------------
// https://github.com/ESGF/esgf-utils/blob/master/node_status/query_prom.py
export const nodeStatusURL = getConfig('REACT_APP_ESGF_NODE_STATUS_URL');

// Keycloak
// ------------------------------------------------------------------------------
// https://github.com/keycloak/keycloak
export const keycloakRealm = getConfig('REACT_APP_KEYCLOAK_REALM');
export const keycloakUrl = getConfig('REACT_APP_KEYCLOAK_URL');
export const keycloakClientId = getConfig('REACT_APP_KEYCLOAK_CLIENT_ID');

// react-hotjar
// ------------------------------------------------------------------------------
// https://github.com/abdalla/react-hotjar
export const hjid = +getConfig('REACT_APP_HOTJAR_ID');
export const hjsv = +getConfig('REACT_APP_HOTJAR_SV');

// Django Auth URLs
export const djangoLoginUrl = getConfig('REACT_APP_DJANGO_LOGIN_URL');
export const djangoLogoutUrl = getConfig('REACT_APP_DJANGO_LOGOUT_URL');

// Authentication Method
export const authenticationMethod = getConfig(
  'REACT_APP_AUTHENTICATION_METHOD'
);
