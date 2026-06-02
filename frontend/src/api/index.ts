/**
 * This file contains HTTP Request functions.
 */

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */

import 'setimmediate'; // Added because in Jest 27, setImmediate is not defined, causing test errors
import humps from 'humps';
import queryString from 'query-string';
import axios, { AxiosResponse } from 'axios';
import {
  RawUserCart,
  RawUserSearchQuery,
  UserCart,
  UserSearchQueries,
  UserSearchQuery,
} from '../components/Cart/types';
import { ActiveFacets, RawProject, RawProjects } from '../components/Facets/types';
import { NodeStatusArray, RawNodeStatus } from '../components/NodeStatus/types';
import {
  ActiveSearchQuery,
  Pagination,
  RawCitation,
  StacAggregations,
  StacAsset,
  StacFeature,
  StacSearchResponse,
  TextInputs,
} from '../components/Search/types';
import { RawUserAuth, RawUserInfo } from '../contexts/types';
import apiRoutes, { ApiRoute, HTTPCodeType } from './routes';
import { GlobusEndpointSearchResults } from '../components/Globus/types';
import {
  cachePagination,
  convertResultTypeToReplicaParam,
  downloadFileForUser,
  getCachedPagination,
  getCachedSearchResults,
} from '../common/utils';
import {
  aggregationsToFacetsData,
  convertSearchParamsIntoStacFilter,
  getAggregationsList,
  getStacProject,
  buildStacProjects,
  setConfiguredAdditionalProjects,
} from '../common/STAC';
import { ProjectsConfig, STAC_PROJECT_LIST } from '../common/useProjectsConfig';

export interface ResponseError extends Error {
  status?: number;
  /* eslint-disable @typescript-eslint/no-redundant-type-constituents */
  response: { status: HTTPCodeType; [key: string]: string | HTTPCodeType };
}

export interface SubmissionResult {
  status: number;
  successes: Record<string, unknown>[];
  failures: string[];
  auth_url: string | undefined;
}

export const STAC_BATCH_SIZE = 100;

export const getCookie = (name: string): null | string => {
  let cookieValue = null;
  const cookieName = name === 'csrftoken' ? 'csrftoken' : `metagrid_${name}`;
  if (document && document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i += 1) {
      const cookie = cookies[i].trim();
      // Does this cookie string begin with the name we want?
      if (cookie.substring(0, cookieName.length + 1) === `${cookieName}=`) {
        cookieValue = decodeURIComponent(cookie.substring(cookieName.length + 1));
        break;
      }
    }
  }
  return cookieValue;
};

export const setCookie = (name: string, value: string, expDays = 7, path = '/'): void => {
  let expires = '';
  /* istanbul ignore else -- @preserve */
  if (expDays) {
    const date = new Date();
    date.setTime(date.getTime() + expDays * 24 * 60 * 60 * 1000);
    expires = `expires=${date.toUTCString()}`;
  }
  const cookieSettings = 'Secure; SameSite=None;';
  document.cookie = `metagrid_${name}=${encodeURIComponent(value)}; ${expires}; path=${path}; ${cookieSettings}`;
};

/* istanbul ignore next -- @preserve */
export const deleteCookie = (name: string, path = '/'): void => {
  document.cookie = `metagrid_${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path};`;
};

/**
 * Must use JSON.parse on the 'str' arg string because axios's transformResponse
 * function attempts to parse the response body using JSON.parse but fails.
 * https://github.com/axios/axios/issues/576
 * https://github.com/axios/axios/issues/430
 *
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const camelizeKeysFromString = (str: string): Record<string, any> =>
  humps.camelizeKeys(JSON.parse(str) as object[]);

/**
 * This function removes the proxyString from the URL so the link can be accessed
 * through the browser.
 */
export const openDownloadURL = (url: string): void => {
  window.location.href = url;
};

/**
 * https://github.com/axios/axios#handling-errors
 */
export const errorMsgBasedOnHTTPStatusCode = (error: ResponseError, route: ApiRoute): string => {
  // Indicates that an HTTP response status code was returned from the server
  if (error.response) {
    // Normalize status to a number when possible
    /* istanbul ignore next -- @preserve */
    const statusNum = Number(error.response.status) || 0;

    // For server errors (5xx) return the generic error message for the route
    if (statusNum >= 500) {
      return route.handleErrorMsg('generic');
    }
    // For other HTTP statuses return the mapped message (may be empty string for some codes)
    return route.handleErrorMsg(error.response.status);
  }

  // A connection could not be established, so return a generic error message
  return route.handleErrorMsg('generic');
};

/**
 * HTTP Request Method: GET
 * HTTP Response Code: 200 OK
 */
export const fetchGlobusAuth = async (): Promise<RawUserAuth> =>
  axios
    .get(apiRoutes.globusAuth.path, { withCredentials: true })
    .then((resp) => {
      return resp.data as Promise<RawUserAuth>;
    })
    .catch((error: ResponseError) => {
      throw new Error(errorMsgBasedOnHTTPStatusCode(error, apiRoutes.globusAuth));
    });

/**
 * HTTP Request Method: POST
 * HTTP Response Code: 200 OK
 */
export const fetchUserAuth = async (args: [string]): Promise<RawUserAuth> =>
  axios
    .post(apiRoutes.keycloakAuth.path, { access_token: args[0] })
    .then((res) => res.data as Promise<RawUserAuth>)
    .catch((error: ResponseError) => {
      throw new Error(errorMsgBasedOnHTTPStatusCode(error, apiRoutes.keycloakAuth));
    });

/**
 * HTTP Request Method: GET
 * HTTP Response Code: 200 OK
 */
export const fetchUserInfo = async (args: [string]): Promise<RawUserInfo> =>
  axios
    .get(apiRoutes.userInfo.path, {
      headers: {
        Authorization: `Bearer ${args[0]}`,
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        'X-CSRFToken': getCookie('csrftoken'),
      },
    })
    .then((res) => res.data as Promise<RawUserInfo>)
    .catch((error: ResponseError) => {
      throw new Error(errorMsgBasedOnHTTPStatusCode(error, apiRoutes.userInfo));
    });

/**
 * HTTP Request Method: GET
 * HTTP Response Code: 200 OK
 */
export const fetchUserCart = async (
  pk: string,
  accessToken: string,
): Promise<{
  results: RawUserCart;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}> =>
  axios
    .get(`${apiRoutes.userCart.path.replace(':pk', pk)}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        'X-CSRFToken': getCookie('csrftoken'),
      },
    })
    .then(
      (res) =>
        res.data as Promise<{
          results: RawUserCart;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          [key: string]: any;
        }>,
    )
    .catch((error: ResponseError) => {
      throw new Error(errorMsgBasedOnHTTPStatusCode(error, apiRoutes.userCart));
    });

/**
 * HTTP Request Method: PATCH
 * HTTP Response Code: 200 OK
 */
export const updateUserCart = async (
  pk: string,
  accessToken: string,
  newUserCart: UserCart,
): Promise<{
  results: RawUserCart;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}> =>
  axios
    .patch(
      `${apiRoutes.userCart.path.replace(':pk', pk)}`,
      { items: newUserCart },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          'X-CSRFToken': getCookie('csrftoken'),
        },
      },
    )
    .then(
      (res) =>
        res.data as Promise<{
          results: RawUserCart;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          [key: string]: any;
        }>,
    )
    .catch((error: ResponseError) => {
      throw new Error(errorMsgBasedOnHTTPStatusCode(error, apiRoutes.userCart));
    });

/**
 * HTTP Request Method: GET
 * HTTP Response: 200 OK
 */
export const fetchUserSearchQueries = async (
  accessToken: string,
): Promise<{
  count: number;
  results: UserSearchQueries;
}> =>
  axios
    .get(apiRoutes.userSearches.path, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        'X-CSRFToken': getCookie('csrftoken'),
      },
      transformResponse: (res: string) => {
        try {
          return camelizeKeysFromString(res);
        } catch (e) {
          return null;
        }
      },
    })
    .then(
      (res) =>
        res.data as Promise<{
          count: number;
          results: UserSearchQueries;
        }>,
    )
    .catch((error: ResponseError) => {
      throw new Error(errorMsgBasedOnHTTPStatusCode(error, apiRoutes.userSearches));
    });

/**
 * HTTP Request Method: POST
 * HTTP Response Code: 201 Created
 */
export const addUserSearchQuery = async (
  userPk: string,
  accessToken: string,
  payload: UserSearchQuery,
): Promise<RawUserSearchQuery> => {
  const decamelizedPayload = humps.decamelizeKeys({
    ...payload,
    user: userPk,
  });
  return axios
    .post(apiRoutes.userSearches.path, decamelizedPayload, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        'X-CSRFToken': getCookie('csrftoken'),
      },
    })
    .then((response) => response.data as Promise<RawUserSearchQuery>)
    .catch((error: ResponseError) => {
      throw new Error(errorMsgBasedOnHTTPStatusCode(error, apiRoutes.userSearches));
    });
};

/**
 * HTTP Request Method: DELETE
 * HTTP Response: 204 No Content
 */
export const deleteUserSearchQuery = async (pk: string, accessToken: string): Promise<''> =>
  axios
    .delete(`${apiRoutes.userSearch.path.replace(':pk', pk)}`, {
      data: {},
      headers: {
        Authorization: `Bearer ${accessToken}`,
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        'X-CSRFToken': getCookie('csrftoken'),
      },
    })
    .then((res) => res.data as Promise<''>)
    .catch((error: ResponseError) => {
      throw new Error(errorMsgBasedOnHTTPStatusCode(error, apiRoutes.userSearch));
    });

/**
 * Applies whitelist/blacklist filtering to the combined list of projects.
 * @param projects - Combined list of all projects (backend + additional)
 * @param whitelist - Project names to show (if specified, ONLY these are shown)
 * @param blacklist - Project names to hide (ignored if whitelist is specified)
 * @returns Filtered list of projects
 */
const applyProjectFilters = (
  projects: RawProjects,
  whitelist: string[],
  blacklist: string[],
): RawProjects => {
  let filtered = projects;

  // Apply whitelist (if not empty, only show whitelisted projects)
  if (whitelist.length > 0) {
    filtered = filtered.filter((p) => whitelist.includes(p.name));
  }

  // Apply blacklist (hide blacklisted projects)
  if (blacklist.length > 0) {
    filtered = filtered.filter((p) => !blacklist.includes(p.name));
  }

  return filtered;
};

/**
 * Handles STAC project name replacement for legacy projects.
 * If a STAC project (name contains " STAC") exists but its legacy counterpart
 * (same name without " STAC") is not in the filtered list, the STAC project
 * replaces the legacy one by removing " STAC" from its name.
 *
 * @param projects - The filtered projects list
 * @returns Projects list with STAC names adjusted if needed
 */
const handleStacProjectReplacement = (projects: RawProjects): RawProjects => {
  return projects.map((project) => {
    // Check if this is a STAC project (has " STAC" in the name)
    if (project.name.includes(' STAC')) {
      // Determine what the legacy project name would be
      const legacyName = project.name.replace(' STAC', '');

      // Check if the legacy project exists in the filtered list
      const legacyExists = projects.some((p) => p.name === legacyName);

      // If legacy doesn't exist, this STAC project replaces it - remove " STAC" from name
      if (!legacyExists) {
        return {
          ...project,
          name: legacyName,
        };
      }
    }

    // Return project unchanged (either not STAC, or legacy counterpart exists)
    return project;
  });
};

/**
 * Fetches projects from the backend database and optionally adds configured projects.
 * Applies whitelist/blacklist filtering to the combined list if configured.
 *
 * HTTP Request Method: GET
 * HTTP Response: 200 OK
 * @param config - Optional projects configuration:
 *   - additionalProjects: Additional projects to add to backend projects
 *   - whitelist: Show only these projects (applies to ALL projects: backend + additional)
 *   - blacklist: Hide these projects (applies to ALL projects: backend + additional)
 */
export const fetchProjects = async (
  config?: ProjectsConfig,
): Promise<{
  results: RawProjects;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}> =>
  axios
    .get(apiRoutes.projects.path, {
      transformResponse: (res: string) => {
        try {
          return camelizeKeysFromString(res);
        } catch (e) {
          return null;
        }
      },
    })
    .then(async (response) => {
      const data = (await response.data) as {
        results: RawProjects;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        [key: string]: any;
      };

      // Calculate starting PK for additional projects
      const backendProjects = data.results
        ? data.results.filter((p) => p.name !== 'All (except CMIP6)')
        : [];
      const startPk = backendProjects.length + 1;

      // Build additional projects list (if configured or using defaults)
      let additionalProjects: RawProjects = [];
      if (window.METAGRID.STAC_URL) {
        const configProjects = config?.additionalProjects;
        if (configProjects && configProjects.length > 0) {
          // Use additional projects from config
          additionalProjects = buildStacProjects(configProjects, startPk);
        } else {
          // Use default STAC projects with correct starting PK
          additionalProjects = buildStacProjects(STAC_PROJECT_LIST, startPk);
        }
        // Store the additional projects globally
        setConfiguredAdditionalProjects(additionalProjects);
      }

      // Get filter configuration
      const whitelist = config?.whitelist || [];
      const blacklist = config?.blacklist || [];

      // Combine projects with additional projects first (at top of dropdown)
      const allProjects: RawProjects = [...additionalProjects, ...backendProjects];

      // Apply whitelist/blacklist filters to the combined list
      let filteredProjects = applyProjectFilters(allProjects, whitelist, blacklist);

      // Handle STAC project name replacement for filtered-out legacy projects
      filteredProjects = handleStacProjectReplacement(filteredProjects);

      if (data.results) {
        return {
          ...response,
          results: filteredProjects,
        };
      }
      return { ...response, results: filteredProjects };
    })
    .catch((error: ResponseError) => {
      throw new Error(errorMsgBasedOnHTTPStatusCode(error, apiRoutes.projects));
    });

export const updatePaginationParams = (url: string, pagination: Pagination): string => {
  const paginationOffset = pagination.page > 1 ? (pagination.page - 1) * pagination.pageSize : 0;

  const baseParams = url
    .replace('limit=0', `limit=${pagination.pageSize}`)
    .replace('offset=0', `offset=${paginationOffset}`);

  return `${baseParams}&`;
};

/**
 * Query string parameters use the logical OR operator, so queries are inclusive.
 *
 * Example output: https://esgf-node.llnl.gov/esg-search/search/?replica=false&offset=0&limit=10&query=foo&baz=option1&foo=option1
 */
export const generateSearchURLQuery = (
  activeSearchQuery: ActiveSearchQuery | UserSearchQuery,
  pagination: { page: number; pageSize: number },
): string => {
  const {
    project,
    versionType,
    resultType,
    minVersionDate,
    maxVersionDate,
    activeFacets,
    textInputs,
    globusOnly,
  } = activeSearchQuery;

  const { isSTAC } = activeSearchQuery.project;

  const baseRoute = isSTAC ? `${apiRoutes.esgfSearchSTAC.path}?` : `${apiRoutes.esgfSearch.path}?`;

  const replicaParam = convertResultTypeToReplicaParam(resultType);

  const facetsUrl =
    'facetsUrl' in project && typeof project.facetsUrl === 'string'
      ? project.facetsUrl
      : 'offset=0&limit=0';
  // STAC uses fixed batch size for client-side pagination; non-STAC uses server-side pagination
  let baseParams = isSTAC
    ? `${facetsUrl.replace('limit=0', `limit=${STAC_BATCH_SIZE}`)}&`
    : updatePaginationParams(facetsUrl, pagination);

  if (versionType === 'latest') {
    baseParams += `latest=true&`;
  }
  if (replicaParam) {
    baseParams += `${replicaParam}&`;
  }
  if (minVersionDate) {
    baseParams += `min_version=${minVersionDate}&`;
  }
  if (maxVersionDate) {
    baseParams += `max_version=${maxVersionDate}&`;
  }

  /* istanbul ignore next -- @preserve */
  if (globusOnly) {
    baseParams += `globusOnly=${globusOnly}&`;
  }

  let textInputsParams = 'query=*';
  if (textInputs.length > 0) {
    textInputsParams = queryString.stringify(
      { query: textInputs },
      {
        arrayFormat: 'comma',
      },
    );
  }

  const activeFacetsParams = queryString.stringify(
    humps.decamelizeKeys(activeFacets) as ActiveFacets,
    {
      arrayFormat: 'comma',
    },
  );

  if (isSTAC) {
    const url = `${baseRoute}${baseParams}${`project_id=${(project as RawProject).projectName}`}&${textInputsParams}&${activeFacetsParams}`;

    return url;
  }

  return `${baseRoute}${baseParams}${textInputsParams}&${activeFacetsParams}`;
};

/**
 * HTTP Request Method: POST
 * HTTP Response Code: 200 OK
 */
export const postSTACSearch = async (
  projectName: string,
  limit: number,
  filter: { op: string; args: unknown } | undefined = undefined,
  q?: TextInputs,
  token?: string,
): Promise<Record<string, unknown>> => {
  const requestBody: {
    collections: string[];
    limit: number;
    filter?: { op: string; args: unknown };
    q?: TextInputs;
    token?: string;
  } = {
    collections: [projectName],
    limit,
  };

  if (filter) {
    requestBody.filter = filter;
  }
  if (q) {
    requestBody.q = q;
  }
  if (token && typeof token === 'string' && token.length > 0) {
    requestBody.token = token;
  }

  return axios
    .post(apiRoutes.esgfSearchSTAC.path, requestBody)
    .then((res) => res.data)
    .catch((error: ResponseError) => {
      throw new Error(errorMsgBasedOnHTTPStatusCode(error, apiRoutes.esgfSearchSTAC));
    });
};

// Cache for STAC aggregations to avoid refetching when only pagination changes
const stacAggregationsCache = new Map<string, StacAggregations>();

/**
 * Normalizes the request URL by removing pagination parameters (offset, limit)
 * This allows us to cache aggregations based on filter params only
 */
const normalizeReqUrlForCache = (reqUrl: string): string => {
  const url = new URL(reqUrl, 'http://dummy-base.com');
  const params = new URLSearchParams(url.search);

  // Remove pagination-related parameters
  params.delete('offset');
  params.delete('limit');

  // Sort parameters for consistent cache keys
  const sortedParams = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('&');

  return sortedParams;
};

/**
 * Creates a cache key from the relevant parameters
 */
const createAggregationsCacheKey = (
  projectName: string,
  normalizedUrl: string,
  filter: { op: string; args: unknown } | undefined,
): string => {
  const filterStr = filter ? JSON.stringify(filter) : 'null';
  return `${projectName}|${normalizedUrl}|${filterStr}`;
};

/**
 * Clears the STAC aggregations cache
 */
export const clearSTACAggregationsCache = (): void => {
  stacAggregationsCache.clear();
};

export const fetchSTACAggregations = async (
  projectName: string,
  reqUrl: string,
  filter: { op: string; args: unknown } | undefined,
): Promise<StacAggregations> => {
  // Create cache key based on non-pagination parameters
  const normalizedUrl = normalizeReqUrlForCache(reqUrl);
  const cacheKey = createAggregationsCacheKey(projectName, normalizedUrl, filter);

  // Check if we have cached results for this query
  const cachedResult = stacAggregationsCache.get(cacheKey);
  if (cachedResult) {
    return Promise.resolve(cachedResult);
  }

  // No cache hit, fetch from API
  const aggregationsList = getAggregationsList(projectName);

  const payload = {
    collections: [projectName],
    aggregations: aggregationsList,
    filter,
  };

  return axios
    .post(`${apiRoutes.esgfAggregationsSTAC.path}`, payload)
    .then((res) => {
      const data = res.data as StacAggregations;
      // Cache the result for future use
      stacAggregationsCache.set(cacheKey, data);
      return data;
    })
    .catch((error: ResponseError) => {
      throw new Error(errorMsgBasedOnHTTPStatusCode(error, apiRoutes.esgfAggregationsSTAC));
    });
};

export const fetchSTACSearchResults = async (
  reqUrlStr: string,
  projectName: string,
  token?: string,
): // eslint-disable-next-line @typescript-eslint/no-explicit-any
Promise<{ [key: string]: any }> => {
  let status = 200;

  const filter = convertSearchParamsIntoStacFilter(reqUrlStr, getStacProject(projectName));

  const query = new URLSearchParams(reqUrlStr || '').get('query');
  let textInputs: TextInputs | undefined;

  // Add text search input
  if (query && query !== '*') {
    textInputs = query.split(',');
  }

  const aggregations = await fetchSTACAggregations(projectName, reqUrlStr, filter)
    .then((response) => {
      // Convert aggregations response into facet data for Metagrid
      const aggregationsToFacets = aggregationsToFacetsData(
        projectName,
        response || { aggregations: [] },
      );
      return aggregationsToFacets;
    })
    .catch((error: ResponseError) => {
      /* istanbul ignore next -- @preserve */
      status = error.cause === 422 ? 422 : (error.cause as number) || 500;
    });

  const searchResults = await postSTACSearch(
    projectName,
    STAC_BATCH_SIZE,
    filter,
    textInputs,
    token,
  );

  const stacResponse: StacSearchResponse = searchResults as StacSearchResponse;

  const filteredFeatures: StacFeature[] = [];

  // Remove duplicate assets based on the href, if size is greater than 0
  stacResponse.features.forEach((feature) => {
    const updatedAssets: { [name: string]: StacAsset } = {};
    const href: string[] = [];
    if (feature.assets) {
      /* istanbul ignore next -- @preserve */
      Object.entries(feature.assets).forEach(([key, asset]) => {
        if (asset['file:size'] && asset['file:size'] > 0) {
          if (asset.href && !href.includes(asset.href)) {
            updatedAssets[key] = asset;
            href.push(asset.href);
          }
        } else {
          updatedAssets[key] = asset;
        }
      });
      filteredFeatures.push({ ...feature, assets: updatedAssets });
    }
  });

  stacResponse.features = filteredFeatures;

  return { search: searchResults, facets: aggregations || {}, stac: true, status };
};

/**
 * HTTP Request Method: GET
 * HTTP Response: 200 OK
 *
 * This function can be called with either PromiseFn or DeferFn.
 * With PromiseFn, arguments are passed in as an object ({reqUrl: string}).
 * Source: https://docs.react-async.com/api/options#promisefn
 * With DeferFn, arguments are passed in as an array ([string]).
 * Source: https://docs.react-async.com/api/options#deferfn
 */
export const fetchSearchResults = async (
  args: [string, string?] | Record<string, string>,
  token?: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<{ [key: string]: any }> => {
  // Check if the request URL is passed in as an array or an object
  let reqUrlStr: string;
  let tokenToUse = token;

  if (Array.isArray(args)) {
    // Check if args[0] is itself an array (when called as run([url, token]))
    if (Array.isArray(args[0])) {
      // Unwrap: args = [[url, token]] → [url, token]
      const [url, tok] = args[0];
      reqUrlStr = url;
      if (tok && typeof tok === 'string') {
        tokenToUse = tok;
      }
    } else {
      // Normal case: args = [url] or [url, token]
      const [url, tok] = args;
      reqUrlStr = url;
      if (tok && typeof tok === 'string') {
        tokenToUse = tok;
      }
    }
  } else {
    reqUrlStr = args.reqUrl;
  }

  // Get cached search results - but skip cache if we have a token (STAC pagination)
  if (!tokenToUse) {
    const cachedResults = getCachedSearchResults();
    /* istanbul ignore next -- @preserve */
    const cachedURL = (cachedResults?.cachedURL as string) || '';

    // If request URL matches the one in local storage, return the cached results
    if (reqUrlStr === cachedURL) {
      return cachedResults;
    }
  }

  const cachedPagination = getCachedPagination();
  const finalUrl = reqUrlStr;

  if (finalUrl.includes('/stac/search?')) {
    // If the request URL is for STAC search, fetch results using the STAC API
    const params = new URLSearchParams(reqUrlStr.split('?')[1]);
    /* istanbul ignore next -- @preserve */
    const projectName = params.get('project_id') || 'CMIP6';

    return fetchSTACSearchResults(finalUrl, projectName, tokenToUse)
      .then((results) => {
        // Prevent breaking the app if the response is not successful
        if (results.status !== 200) {
          // Handle the case where status is 422 due to a offset value that is too high
          /* istanbul ignore next -- @preserve */
          if (results.status === 422) {
            cachePagination({
              page: 1,
              pageSize: cachedPagination.pageSize,
            });
            throw new Error('', { cause: 422 });
          }
        }

        return results;
      })
      .catch((error: ResponseError) => {
        /* istanbul ignore next -- @preserve */
        if (error.cause === 422) {
          throw new Error(errorMsgBasedOnHTTPStatusCode(error, apiRoutes.esgfSearchSTAC), {
            cause: 422,
          });
        } else {
          throw new Error(errorMsgBasedOnHTTPStatusCode(error, apiRoutes.esgfSearchSTAC));
        }
      });
  }

  return fetch(finalUrl)
    .then((results) => {
      // Prevent breaking the app if the response is not successful
      if (results.status !== 200) {
        // Handle the case where status is 422 due to a offset value that is too high
        if (results.status === 422) {
          cachePagination({
            page: 1,
            pageSize: cachedPagination.pageSize,
          });
          throw new Error('', { cause: 422 });
        }
      }

      const resultsJson = results.json();

      return resultsJson;
    })
    .catch((error: ResponseError) => {
      if (error.cause === 422) {
        throw new Error(errorMsgBasedOnHTTPStatusCode(error, apiRoutes.esgfSearch), {
          cause: 422,
        });
      } else {
        throw new Error(errorMsgBasedOnHTTPStatusCode(error, apiRoutes.esgfSearch));
      }
    });
};

/**
 * Performs processing on citation objects.
 */
export const processCitation = (citation: RawCitation): RawCitation => {
  const newCitation = citation;

  newCitation.identifierDOI = `http://${newCitation.identifier.identifierType.toLowerCase()}.org/${
    newCitation.identifier.id
  }`;

  newCitation.license = newCitation.rightsList.map((elem) => elem.rights).join('; ');

  // Allow a max of 3 creators to be displayed
  if (newCitation.creators.length > 3) {
    newCitation.creatorsList = newCitation.creators
      .slice(0, 3)
      .map((elem) => elem.creatorName)
      .join('; ')
      .concat('; et al.');
  } else {
    newCitation.creatorsList = newCitation.creators.map((elem) => elem.creatorName).join('; ');
  }

  return newCitation;
};

/**
 * HTTP Request Method: GET
 * HTTP Response: 200 OK
 */
export const fetchDatasetCitation = async ({
  url,
}: {
  [key: string]: string;
}): Promise<{ [key: string]: unknown }> =>
  axios
    .post('proxy/citation', {
      citurl: url,
    })
    .then((res) => {
      const citation = processCitation(res.data as RawCitation);
      return citation;
    })
    .catch((error: ResponseError) => {
      throw new Error(errorMsgBasedOnHTTPStatusCode(error, apiRoutes.citation));
    });

export type FetchDatasetFilesProps = {
  id: string;
  paginationOptions: Pagination;
  filenameVars?: TextInputs | [];
};

/**
 * HTTP Request Method: GET
 * HTTP Response: 200 OK
 *
 * This function is invoked by react-async package's deferFn method.
 * https://docs.react-async.com/api/options#deferfn
 *
 * Example output: https://esgf-node.llnl.gov/esg-search/search/?dataset_id=cmip5.output1.BCC.bcc-csm1-1.abrupt4xCO2.mon.ocean.Omon.r2i1p1.v20120202%7Caims3.llnl.gov&format=application%2Fsolr%2Bjson&type=File&query=hfds,Omon
 */
export const fetchDatasetFiles = async (
  _args: [],
  props: FetchDatasetFilesProps,
): Promise<{ [key: string]: unknown }> => {
  const { id, paginationOptions, filenameVars } = props;
  const queryParams: {
    format: string;
    type: 'File';
    offset: number;
    limit: number;
    dataset_id: string;
    query?: string[];
  } = {
    format: 'application/solr+json',
    type: 'File',
    offset: 0,
    limit: 0,
    dataset_id: id,
  };

  if (filenameVars && filenameVars.length > 0) {
    queryParams.query = filenameVars;
  }

  let url = queryString.stringifyUrl(
    {
      url: apiRoutes.esgfSearch.path,
      query: queryParams,
    },
    { arrayFormat: 'comma' },
  );
  url = updatePaginationParams(url, paginationOptions);

  return axios
    .get(url)
    .then(
      (res) =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        res.data as Promise<{ [key: string]: any }>,
    )
    .catch((error: ResponseError) => {
      throw new Error(errorMsgBasedOnHTTPStatusCode(error, apiRoutes.esgfSearch));
    });
};

/**
 * Performs wget request from the API.
 *
 */
export const fetchWgetScript = async (ids: string[], filenameVars?: string[]): Promise<void> => {
  const data = {
    dataset_id: ids,
    query: filenameVars,
  };

  const d = new Date();
  const fileName = `wget_script_${d.getFullYear()}-${
    d.getMonth() + 1
  }-${d.getDate()}_${d.getHours()}-${d.getMinutes()}-${d.getSeconds()}.sh`;

  return axios
    .post(apiRoutes.wget.path, data)
    .then((resp) => downloadFileForUser(fileName, resp.data as string))
    .catch((error: ResponseError) => {
      throw new Error(errorMsgBasedOnHTTPStatusCode(error, apiRoutes.wget));
    });
};

export const loadSessionValue = async <T>(key: string): Promise<T | null> => {
  return axios
    .post(apiRoutes.tempStorageGet.path, { dataKey: key })
    .then((resp: AxiosResponse) => {
      const { data } = resp;
      if (data && key in data) {
        // eslint-disable-next-line
        const value: T | null = data[key];
        if ((value as unknown) === 'None') {
          return null;
        }
        return value as T;
      }
      return null;
    })
    .catch(
      /* istanbul ignore next -- @preserve */
      (error: ResponseError) => {
        throw new Error(errorMsgBasedOnHTTPStatusCode(error, apiRoutes.tempStorageGet));
      },
    );
};

export const saveSessionValue = async <T>(key: string, value: T): Promise<AxiosResponse> => {
  let data: { dataKey: string; dataValue: T | string } = {
    dataKey: key,
    dataValue: 'None',
  };
  if (value !== null && value !== undefined) {
    data = { ...data, dataValue: value };
  }
  return axios
    .post(apiRoutes.tempStorageSet.path, JSON.stringify(data))
    .then((res) => {
      return res.data;
    })
    .catch(
      /* istanbul ignore next -- @preserve */
      (error: ResponseError) => {
        throw new Error(errorMsgBasedOnHTTPStatusCode(error, apiRoutes.tempStorageSet));
      },
    );
};

export const saveSessionValues = async (data: { key: string; value: unknown }[]): Promise<void> => {
  const saveFuncs: Promise<AxiosResponse>[] = [];
  data.forEach((value) => {
    saveFuncs.push(saveSessionValue(value.key, value.value));
  });

  await Promise.all(saveFuncs);
};

export const resetGlobusTokens = async (): Promise<AxiosResponse> => {
  return axios
    .get(apiRoutes.globusResetTokens.path)
    .then((res) => {
      return res;
    })
    .catch((error: ResponseError) => {
      throw new Error(errorMsgBasedOnHTTPStatusCode(error, apiRoutes.globusResetTokens));
    });
};

export const startSearchGlobusEndpoints = async (
  searchText: string,
): Promise<GlobusEndpointSearchResults> => {
  return axios
    .get(apiRoutes.globusSearchEndpoints.path, {
      params: { search_text: searchText },
    })
    .then((resp) => {
      return resp;
    })
    .catch((error: ResponseError) => {
      throw new Error(errorMsgBasedOnHTTPStatusCode(error, apiRoutes.globusSearchEndpoints));
    });
};

/**
 * Parses the results of the node status API to simplify the data structure.
 */
export const parseNodeStatus = (res: RawNodeStatus): NodeStatusArray => {
  const parsedRes = [] as NodeStatusArray;

  res.data.result.forEach((node) => {
    const { instance, target: source } = node.metric;
    const [epochTimestamp, isOnline] = node.value;

    const timestamp = new Date(epochTimestamp * 1000).toUTCString();

    parsedRes.push({
      name: instance,
      source,
      timestamp,
      isOnline: Boolean(Number(isOnline)),
    });
  });

  parsedRes.sort((a, b) => a.name.localeCompare(b.name));

  return parsedRes;
};

/**
 * HTTP Request Method: GET
 * HTTP Response: 200 OK
 */
export const fetchNodeStatus = async (): Promise<NodeStatusArray> =>
  axios
    .get(`${apiRoutes.nodeStatus.path}`)
    .then((res) => parseNodeStatus(res.data as RawNodeStatus))
    .catch((error: ResponseError) => {
      throw new Error(errorMsgBasedOnHTTPStatusCode(error, apiRoutes.nodeStatus));
    });
