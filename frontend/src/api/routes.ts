import { esgfSearchURL, metagridApiURL } from '../env';

export type HTTPCodeType = 400 | 401 | 403 | 404 | 405 | 408 | 'generic';

/**
 * Update this function if more API HTTP codes need to be handled.
 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status
 */
export const mapHTTPErrorCodes = (
  service: string,
  HTTPCode: HTTPCodeType
): string => {
  const HTTPCodes = {
    400: `Your request to the ${service} service was invalid. Please contact support.`,
    401: `Your request to the ${service} service was unauthorized. Please contact support.`,
    403: `Your request to the ${service} service was forbidden. Please contact support.`,
    404: `The requested resource at the ${service} service was invalid. Please contact support.`,
    405: `Could not perform operation at the ${service} service. Please contact support`,
    408: '',
    // Adds verbosity to network errors that have generic messages.
    // For example, the axios default network error message is "Error: Network Error".
    // This typically occurs when an API/service is down and unable to be reached.
    generic: `We couldn't reach the ${service} service and are working on it. If the problem persists for awhile, please contact support.`,
  };
  return HTTPCodes[HTTPCode];
};

export type ApiRoute = {
  path: string;
  handleErrorMsg: (HTTPCode: HTTPCodeType) => string;
};

type ApiRoutes = {
  globusAuth: ApiRoute;
  keycloakAuth: ApiRoute;
  globusGetEndpoint: ApiRoute;
  globusSearchEndpoints: ApiRoute;
  globusTransfer: ApiRoute;
  userInfo: ApiRoute;
  userCart: ApiRoute;
  userSearches: ApiRoute;
  userSearch: ApiRoute;
  projects: ApiRoute;
  esgfSearch: ApiRoute;
  citation: ApiRoute;
  wget: ApiRoute;
  nodeStatus: ApiRoute;
  tempStorageGet: ApiRoute;
  tempStorageSet: ApiRoute;
};

/**
 * Stripping the prefix proxy string is necessary if the route needs to be
 * served as a clickable link within the browser.
 */
export const clickableRoute = (route: string): string =>
  route.replace(`${metagridApiURL}/proxy/search`, `${esgfSearchURL}`);

// Any path with parameters (e.g. '/:datasetID/') must be in camelCase
// https://mswjs.io/docs/basics/path-matching#path-with-parameters
const apiRoutes: ApiRoutes = {
  // Globus APIs
  globusAuth: {
    path: `${metagridApiURL}/proxy/globus-auth/`,
    handleErrorMsg: (HTTPCode) => mapHTTPErrorCodes('Globus', HTTPCode),
  },
  globusGetEndpoint: {
    path: `${metagridApiURL}/proxy/globus-get-endpoint/`,
    handleErrorMsg: (HTTPCode) => mapHTTPErrorCodes('Globus', HTTPCode),
  },
  globusSearchEndpoints: {
    path: `${metagridApiURL}/proxy/globus-search-endpoints/`,
    handleErrorMsg: (HTTPCode) => mapHTTPErrorCodes('Globus', HTTPCode),
  },
  // MetaGrid APIs
  keycloakAuth: {
    path: `${metagridApiURL}/dj-rest-auth/keycloak`,
    handleErrorMsg: (HTTPCode) => mapHTTPErrorCodes('Keycloak', HTTPCode),
  },
  globusTransfer: {
    path: `${metagridApiURL}/globus/transfer`,
    handleErrorMsg: (HTTPCode) =>
      mapHTTPErrorCodes('Globus transfer', HTTPCode),
  },
  userInfo: {
    path: `${metagridApiURL}/dj-rest-auth/user/`,
    handleErrorMsg: (HTTPCode) =>
      mapHTTPErrorCodes('user authentication', HTTPCode),
  },
  userCart: {
    path: `${metagridApiURL}/api/v1/carts/datasets/:pk/`,
    handleErrorMsg: (HTTPCode) => mapHTTPErrorCodes('user cart', HTTPCode),
  },
  userSearches: {
    path: `${metagridApiURL}/api/v1/carts/searches/`,
    handleErrorMsg: (HTTPCode) =>
      mapHTTPErrorCodes('user saved searches', HTTPCode),
  },
  userSearch: {
    path: `${metagridApiURL}/api/v1/carts/searches/:pk/`,
    handleErrorMsg: (HTTPCode) =>
      mapHTTPErrorCodes('user saved searches', HTTPCode),
  },
  projects: {
    path: `${metagridApiURL}/api/v1/projects/`,
    handleErrorMsg: (HTTPCode) =>
      mapHTTPErrorCodes('MetaGrid projects API', HTTPCode),
  },
  // ESGF Search API
  esgfSearch: {
    path: `${metagridApiURL}/proxy/search`,
    handleErrorMsg: (HTTPCode) =>
      mapHTTPErrorCodes('ESGF Search API', HTTPCode),
  },
  // ESGF Citation API (uses dummy path 'citation_url' for testing since the
  // URL is included in each Search API dataset result)
  citation: {
    path: `${metagridApiURL}/proxy/citation`,
    handleErrorMsg: (HTTPCode) =>
      mapHTTPErrorCodes('ESGF Citation API', HTTPCode),
  },
  // ESGF wget API
  wget: {
    path: `${metagridApiURL}/proxy/wget`,
    handleErrorMsg: (HTTPCode) => mapHTTPErrorCodes('ESGF wget API', HTTPCode),
  },
  // ESGF Node Status API
  nodeStatus: {
    path: `${metagridApiURL}/proxy/status`,
    handleErrorMsg: (HTTPCode) =>
      mapHTTPErrorCodes('ESGF Node Status API', HTTPCode),
  },
  tempStorageGet: {
    path: `${metagridApiURL}/tempStorage/get`,
    handleErrorMsg: (HTTPCode) =>
      mapHTTPErrorCodes('Temp Storage Get', HTTPCode),
  },
  tempStorageSet: {
    path: `${metagridApiURL}/tempStorage/set`,
    handleErrorMsg: (HTTPCode) =>
      mapHTTPErrorCodes('Temp Storage Set', HTTPCode),
  },
};

export default apiRoutes;
