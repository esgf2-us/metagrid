/**
 * This file transforms environment variables into constants for re-usability.
 *
 * Make sure it is consistent with .envs/frontend, .react!
 */

// MetaGrid API
// ------------------------------------------------------------------------------
// https://github.com/aims-group/metagrid/tree/master/backend
export const metagridApiURL: string = window.REACT_APP_METAGRID_API_URL;

// Redirect frontend
export const publicUrl = process.env.PUBLIC_URL;
export const previousPublicUrl = process.env.REACT_APP_PREVIOUS_URL as string;

// ESGF wget API
// ------------------------------------------------------------------------------
// https://github.com/ESGF/esgf-wget
export const wgetApiURL = (window.REACT_APP_WGET_API_URL as unknown) as string;

// ESGF Search API
// ------------------------------------------------------------------------------
// https://esgf.github.io/esg-search/ESGF_Search_RESTful_API.html
export const esgfNodeURL = (window.REACT_APP_ESGF_NODE_URL as unknown) as string;
export const esgfNodeURLNoProtocol = esgfNodeURL.split('//')[1];

// ESGF Node Status API
// ------------------------------------------------------------------------------
// https://github.com/ESGF/esgf-utils/blob/master/node_status/query_prom.py
export const nodeStatusURL = (window.REACT_APP_ESGF_NODE_STATUS_URL as unknown) as string;

// Keycloak
// ------------------------------------------------------------------------------
// https://github.com/keycloak/keycloak
export const keycloakRealm = (window.REACT_APP_KEYCLOAK_REALM as unknown) as string;
export const keycloakUrl = (window.REACT_APP_KEYCLOAK_URL as unknown) as string;
export const keycloakClientId = (window.REACT_APP_KEYCLOAK_CLIENT_ID as unknown) as string;

// react-hotjar
// ------------------------------------------------------------------------------
// https://github.com/abdalla/react-hotjar
export const hjid = (window.REACT_APP_HOTJAR_ID as unknown) as number;
export const hjsv = (window.REACT_APP_HOTJAR_SV as unknown) as number;
