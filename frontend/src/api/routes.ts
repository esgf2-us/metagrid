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
import { esgfNodeURL, metagridApiURL, proxyURL, wgetApiURL } from '../env';

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
  return route.replace(`${proxyURL}/`, '');
};

const apiRoutes: ApiRoutes = {
  // MetaGrid API
  keycloakAuth: `${metagridApiURL}/dj-rest-auth/keycloak`,
  userInfo: `${metagridApiURL}/dj-rest-auth/user/`,
  userCart: `${metagridApiURL}/api/v1/carts/datasets/:pk/`,
  userSearches: `${metagridApiURL}/api/v1/carts/searches/`,
  userSearch: `${metagridApiURL}/api/v1/carts/searches/:pk/`,
  projects: `${metagridApiURL}/api/v1/projects/`,
  // ESGF Search API - datasets
  esgfDatasets: `${proxyURL}/${esgfNodeURL}/esg-search/search/`,
  // ESGF Search API - files
  esgfFiles: `${proxyURL}/${esgfNodeURL}/search_files/:id/${esgfNodeURL}/`,
  // ESGF Citation API (uses dummy link)
  citation: `${proxyURL}/citation_url`,
  // ESGF wget API
  wget: `${proxyURL}/${wgetApiURL}`,
};

export default apiRoutes;
