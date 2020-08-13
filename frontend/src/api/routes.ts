/**
 * This file contains API routes.
 *
 * For more information on available HTTP Request Methods for a given route,
 * refer to the MetaGrid swagger docs.
 *
 * For more information on the ESGF Search API, refer to the official docs:
 * https://github.com/ESGF/esgf.github.io/wiki/ESGF_Search_REST_API
 *
 */
import {
  apiBaseUrl,
  nodeRoute,
  nodeUrl,
  proxyString,
  wgetApiUrl,
} from '../env';

type ApiRoutes = {
  keycloakAuth: string;
  userInfo: string;
  userCart: string;
  userSearches: string;
  userSearch: string;
  projects: string;
  esgfDatasets: string;
  esgfFiles: string;
  citation: string;
  wget: string;
};

/**
 * Strips the proxy string from a route.
 * Stripping the proxy string is necessary if the route needs to be served as a
 * clickable link within the browser.
 * @param route
 */
export const clickableRoute = (route: string): string => {
  return route.replace(`${proxyString}/`, '');
};

const apiRoutes: ApiRoutes = {
  // MetaGrid API
  keycloakAuth: `${apiBaseUrl}/dj-rest-auth/keycloak`,
  userInfo: `${apiBaseUrl}/dj-rest-auth/user/`,
  userCart: `${apiBaseUrl}/api/v1/carts/datasets/:pk/`,
  userSearches: `${apiBaseUrl}/api/v1/carts/searches/`,
  userSearch: `${apiBaseUrl}/api/v1/carts/searches/:pk/`,
  projects: `${apiBaseUrl}/api/v1/projects/`,
  // ESGF Search API - datasets
  esgfDatasets: `${proxyString}/${nodeRoute}/esg-search/search/`,
  // ESGF Search API - files
  esgfFiles: `${proxyString}/${nodeRoute}/search_files/:id/${nodeUrl}/`,
  // ESGF Citation API (uses dummy link)
  citation: `${proxyString}/citation_url`,
  // ESGF wget API
  wget: `${proxyString}/${wgetApiUrl}`,
};

export default apiRoutes;
