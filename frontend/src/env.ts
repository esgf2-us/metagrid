/**
 * This file sets environment variables as constants for re-use.
 *
 * Make sure it is consistent with .envs!
 */

const apiProtocol = process.env.REACT_APP_API_PROTOCOL as string;
const apiUrl = process.env.REACT_APP_API_URL as string;
const apiPort = process.env.REACT_APP_API_PORT as string;
export const apiBaseUrl = `${apiProtocol}${apiUrl}:${apiPort}`;

// wget Script API
export const wgetApiUrl = process.env.REACT_APP_WGET_API_URL as string;

// ESG Search API
// ------------------------------------------------------------------------------
// https://esgf.github.io/esg-search/ESGF_Search_RESTful_API.html
export const nodeProtocol = `${
  process.env.REACT_APP_ESGF_NODE_PROTOCOL as string
}`;
export const nodeUrl = `${process.env.REACT_APP_ESGF_NODE_URL as string}`;
export const nodeRoute = `${nodeProtocol}${nodeUrl}`;

// CORS Anywhere configuration
// ------------------------------------------------------------------------------
// https://github.com/Rob--W/cors-anywhere
const proxyProtocol = process.env.REACT_APP_PROXY_PROTOCOL as string;
const proxyHost = process.env.REACT_APP_PROXY_HOST as string;
const proxyPort = process.env.REACT_APP_PROXY_PORT as string;
export const proxyString = `${proxyProtocol}${proxyHost}:${proxyPort}`;

// Keycloak
// ------------------------------------------------------------------------------
// https://github.com/keycloak/keycloak
export const keycloakRealm = process.env.REACT_APP_KEYCLOAK_REALM as string;
export const keycloakUrl = process.env.REACT_APP_KEYCLOAK_URL as string;
export const keycloakClientId = process.env
  .REACT_APP_KEYCLOAK_CLIENT_ID as string;
