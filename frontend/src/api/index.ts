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
  NonStacSearchResponse,
  Pagination,
  RawCitation,
  SearchResults,
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
  getCachedNonStacBatch,
  cacheNonStacBatch,
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

export const SEARCH_BATCH_SIZE = 100;

// Generic memoization cache with TTL
type MemoizedEntry<T> = {
  result: T;
  timestamp: number;
};

// Track all memoization caches for clearing
const memoizationCaches: Array<Map<string, MemoizedEntry<unknown>>> = [];

// In-memory cache for fetchProjects with in-flight promise tracking
const fetchProjectsCache: Map<
  string,
  {
    promise?: Promise<{ results: RawProjects; [key: string]: unknown }>;
    result?: { results: RawProjects; [key: string]: unknown };
    timestamp?: number;
  }
> = new Map();

// Track the current expected project for STAC requests
// Set when switching projects to invalidate requests for the old project
let currentStacProject: string | null = null;

// Cache for STAC search with in-flight promise tracking
const stacSearchCache = new Map<
  string,
  {
    promise?: Promise<Record<string, unknown>>;
    result?: Record<string, unknown>;
    timestamp?: number;
  }
>();

const STAC_SEARCH_CACHE_TTL = 60000; // 1 minute

// Cache for STAC aggregations with in-flight promise tracking
const stacAggregationsCache = new Map<
  string,
  {
    promise?: Promise<StacAggregations>;
    result?: StacAggregations;
    timestamp?: number;
  }
>();

const STAC_AGGREGATIONS_CACHE_TTL = 300000; // 5 minutes (aggregations change less frequently)

// Cache for Globus auth with in-flight promise tracking
let globusAuthCache: {
  promise?: Promise<RawUserAuth>;
  result?: RawUserAuth;
  timestamp?: number;
} = {};

/**
 * Creates a memoized version of an async function with time-based cache expiration.
 *
 * This provides in-memory request deduplication to prevent redundant API calls when:
 * - The same request is made multiple times in quick succession
 * - Component re-renders trigger duplicate requests
 * - Race conditions cause overlapping identical requests
 *
 * Note: This is separate from localStorage-based caching which persists across sessions.
 *
 * @param fn - The async function to memoize
 * @param ttl - Time to live in milliseconds (default: 60000ms = 1 minute)
 * @param keyGenerator - Optional function to generate cache key from arguments
 */
export function memoizeAsync<TArgs extends unknown[], TReturn>(
  fn: (...args: TArgs) => Promise<TReturn>,
  ttl = 60000,
  keyGenerator?: (...args: TArgs) => string,
): (...args: TArgs) => Promise<TReturn> {
  const cache = new Map<string, MemoizedEntry<TReturn>>();
  memoizationCaches.push(cache as Map<string, MemoizedEntry<unknown>>);

  return async (...args: TArgs): Promise<TReturn> => {
    // Generate cache key
    const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);

    // Check if we have a valid cached entry
    const cached = cache.get(key);
    const now = Date.now();

    if (cached && now - cached.timestamp < ttl) {
      return cached.result;
    }

    // Call the function and cache the result
    const result = await fn(...args);
    cache.set(key, { result, timestamp: now });

    // Clean up expired entries periodically (every 10 entries)
    if (cache.size % 10 === 0) {
      Array.from(cache.entries()).forEach(([k, entry]) => {
        if (now - entry.timestamp >= ttl) {
          cache.delete(k);
        }
      });
    }

    return result;
  };
}

/**
 * Clears all memoization caches
 * Useful for testing or when you want to force fresh API calls
 */
export const clearAllMemoizationCaches = (): void => {
  memoizationCaches.forEach((cache) => cache.clear());
  fetchProjectsCache.clear();
  stacSearchCache.clear();
  stacAggregationsCache.clear();
  globusAuthCache = {};
};

/**
 * Clears only the STAC-specific caches (search and aggregations)
 * Use this when switching between STAC projects to prevent stale data
 * Sets the expected project name so requests for the old project are ignored
 */
export const clearStacCaches = (newProjectName?: string): void => {
  // eslint-disable-next-line no-console
  console.log('[clearStacCaches] Clearing STAC caches, new project:', newProjectName || 'unknown');

  // Set the expected project name
  currentStacProject = newProjectName || null;

  stacSearchCache.clear();
  stacAggregationsCache.clear();
};

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

const GLOBUS_AUTH_CACHE_TTL = 60000; // 1 minute

/**
 * HTTP Request Method: GET
 * HTTP Response Code: 200 OK
 *
 * Cached with in-flight promise tracking to prevent duplicate auth requests
 */
export const fetchGlobusAuth = async (): Promise<RawUserAuth> => {
  const now = Date.now();

  // Return cached result if still valid
  if (
    globusAuthCache.result &&
    globusAuthCache.timestamp &&
    now - globusAuthCache.timestamp < GLOBUS_AUTH_CACHE_TTL
  ) {
    return Promise.resolve(globusAuthCache.result);
  }

  // Return in-flight promise if already fetching
  if (globusAuthCache.promise) {
    return globusAuthCache.promise;
  }

  // Start new fetch and cache the promise
  globusAuthCache.promise = axios
    .get(apiRoutes.globusAuth.path, { withCredentials: true })
    .then((resp) => {
      const data = resp.data as RawUserAuth;
      // Cache the result
      globusAuthCache = {
        result: data,
        timestamp: Date.now(),
        promise: undefined,
      };
      return data;
    })
    .catch((error: ResponseError) => {
      // Clear the promise on error so it can be retried
      globusAuthCache.promise = undefined;
      throw new Error(errorMsgBasedOnHTTPStatusCode(error, apiRoutes.globusAuth));
    });

  return globusAuthCache.promise;
};

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
 * Internal implementation of fetchProjects without memoization
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
const fetchProjectsImpl = async (
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

const FETCH_PROJECTS_CACHE_TTL = 60000; // 1 minute

/**
 * Generates a cache key for fetchProjects based on config parameters
 */
const generateProjectsCacheKey = (config?: ProjectsConfig): string => {
  if (!config) {
    return 'default|none|none';
  }
  const additionalProjsKey = config.additionalProjects?.length
    ? JSON.stringify(config.additionalProjects.map((p) => p.name))
    : 'default';
  const whitelistKey = config.whitelist?.length ? JSON.stringify(config.whitelist) : 'none';
  const blacklistKey = config.blacklist?.length ? JSON.stringify(config.blacklist) : 'none';
  return `${additionalProjsKey}|${whitelistKey}|${blacklistKey}`;
};

/**
 * Memoized version of fetchProjects with 1-minute cache and in-flight promise tracking
 *
 * This in-memory cache prevents duplicate API calls when:
 * - Component re-renders trigger the same fetchProjects call
 * - Multiple components request projects configuration simultaneously
 * - User navigates between pages without leaving the application
 *
 * In-flight promise tracking ensures that if multiple components call fetchProjects
 * at the same time, they all share the same promise and only one API call is made.
 */
export const fetchProjects = async (
  config?: ProjectsConfig,
): Promise<{
  results: RawProjects;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}> => {
  const cacheKey = generateProjectsCacheKey(config);
  const now = Date.now();
  const cached = fetchProjectsCache.get(cacheKey);

  // Return cached result if still valid
  if (cached?.result && cached.timestamp && now - cached.timestamp < FETCH_PROJECTS_CACHE_TTL) {
    return Promise.resolve(cached.result);
  }

  // Return in-flight promise if already fetching
  if (cached?.promise) {
    return cached.promise;
  }

  // Start new fetch and cache the promise
  const promise = fetchProjectsImpl(config)
    .then((result) => {
      // Cache the result
      fetchProjectsCache.set(cacheKey, {
        result,
        timestamp: Date.now(),
        promise: undefined,
      });
      return result;
    })
    .catch((error) => {
      // Clear the promise on error so it can be retried
      const entry = fetchProjectsCache.get(cacheKey);
      if (entry) {
        entry.promise = undefined;
      }
      throw error;
    });

  // Cache the in-flight promise
  fetchProjectsCache.set(cacheKey, { promise });

  return promise;
};

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
  // STAC uses fixed batch size; non-STAC uses regular pagination params
  let baseParams = isSTAC
    ? `${facetsUrl.replace('limit=0', `limit=${SEARCH_BATCH_SIZE}`)}&`
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
 * Internal implementation - use memoized version below
 */
const postSTACSearchImpl = async (
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

/**
 * Generates a cache key for postSTACSearch based on search parameters
 */
const generateStacSearchCacheKey = (
  projectName: string,
  limit: number,
  filter: { op: string; args: unknown } | undefined,
  q?: TextInputs,
  token?: string,
): string => {
  const filterStr = filter ? JSON.stringify(filter) : 'null';
  const qStr = q ? JSON.stringify(q) : 'null';

  // Handle token properly - it could be a string, object, or undefined
  let tokenStr = 'null';
  if (token !== undefined && token !== null) {
    tokenStr = typeof token === 'object' ? JSON.stringify(token) : token;
  }

  return `${projectName}|${limit}|${filterStr}|${qStr}|${tokenStr}`;
};

/**
 * Memoized version of postSTACSearch with 1-minute cache and in-flight promise tracking
 *
 * This in-memory cache prevents duplicate API calls when:
 * - Component re-renders trigger the same search
 * - User rapidly switches between pages with same token
 * - Race conditions cause multiple identical requests
 * - Multiple components request the same search simultaneously
 *
 * In-flight promise tracking ensures that if multiple components call postSTACSearch
 * at the same time with the same parameters, they all share the same promise and
 * only one API call is made.
 */
export const postSTACSearch = async (
  projectName: string,
  limit: number,
  filter: { op: string; args: unknown } | undefined = undefined,
  q?: TextInputs,
  token?: string,
): Promise<Record<string, unknown>> => {
  // eslint-disable-next-line no-console
  console.log('[postSTACSearch] Request for project:', projectName);
  // eslint-disable-next-line no-console
  console.log('[postSTACSearch] Current expected project:', currentStacProject);

  // Check if this request is for a stale project BEFORE doing anything
  if (currentStacProject !== null && currentStacProject !== projectName) {
    // eslint-disable-next-line no-console
    console.log(
      '[postSTACSearch] ✗ BLOCKING stale request for:',
      projectName,
      `(expected: ${currentStacProject})`,
    );
    // Return a promise that never resolves - it will be abandoned when component re-renders
    // This avoids triggering error handlers in the UI
    return new Promise(() => {
      // Never resolves or rejects - just hangs until garbage collected
    });
  }

  const cacheKey = generateStacSearchCacheKey(projectName, limit, filter, q, token);
  const now = Date.now();
  const cached = stacSearchCache.get(cacheKey);

  // eslint-disable-next-line no-console
  console.log('[postSTACSearch] FULL Cache key:', cacheKey);
  // eslint-disable-next-line no-console
  console.log('[postSTACSearch] Cache has', stacSearchCache.size, 'entries');
  // eslint-disable-next-line no-console
  console.log('[postSTACSearch] Cache lookup result:', cached ? 'FOUND' : 'NOT FOUND');

  // Return cached result if still valid
  if (cached?.result && cached.timestamp && now - cached.timestamp < STAC_SEARCH_CACHE_TTL) {
    const age = Math.round((now - cached.timestamp) / 1000);
    // eslint-disable-next-line no-console
    console.log(`[postSTACSearch] ✓ Returning CACHED result for: ${projectName} (age: ${age}s)`);
    return Promise.resolve(cached.result);
  }

  // Return in-flight promise if already fetching
  if (cached?.promise) {
    // eslint-disable-next-line no-console
    console.log('[postSTACSearch] ⏳ Returning IN-FLIGHT promise for:', projectName);
    return cached.promise;
  }

  // eslint-disable-next-line no-console
  console.log('[postSTACSearch] → Making NEW request for:', projectName);

  // Start new fetch and cache the promise
  const promise = postSTACSearchImpl(projectName, limit, filter, q, token)
    .then((result) => {
      // eslint-disable-next-line no-console
      console.log('[postSTACSearch] ✓ Request completed for:', projectName);
      // eslint-disable-next-line no-console
      console.log(
        '[postSTACSearch] 💾 CACHING result with key:',
        `${cacheKey.substring(0, 80)}...`,
      );
      // Cache the result
      stacSearchCache.set(cacheKey, {
        result,
        timestamp: Date.now(),
        promise: undefined,
      });
      return result;
    })
    .catch((error) => {
      // eslint-disable-next-line no-console
      console.error('[postSTACSearch] ✗ Request failed for:', projectName, error);
      // Clear the promise on error so it can be retried
      const entry = stacSearchCache.get(cacheKey);
      if (entry) {
        entry.promise = undefined;
      }
      throw error;
    });

  // Cache the in-flight promise
  stacSearchCache.set(cacheKey, { promise });

  return promise;
};

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
  // eslint-disable-next-line no-console
  console.log('[fetchSTACAggregations] Request for project:', projectName);
  // eslint-disable-next-line no-console
  console.log('[fetchSTACAggregations] Current expected project:', currentStacProject);

  // Check if this request is for a stale project BEFORE doing anything
  if (currentStacProject !== null && currentStacProject !== projectName) {
    // eslint-disable-next-line no-console
    console.log(
      '[fetchSTACAggregations] ✗ BLOCKING stale request for:',
      projectName,
      `(expected: ${currentStacProject})`,
    );
    // Return a promise that never resolves - it will be abandoned when component re-renders
    // This avoids triggering error handlers in the UI
    return new Promise(() => {
      // Never resolves or rejects - just hangs until garbage collected
    });
  }

  // Create cache key based on non-pagination parameters
  const normalizedUrl = normalizeReqUrlForCache(reqUrl);
  const cacheKey = createAggregationsCacheKey(projectName, normalizedUrl, filter);

  const now = Date.now();
  const cached = stacAggregationsCache.get(cacheKey);

  // Return cached result if available and not expired
  if (cached?.result && cached.timestamp && now - cached.timestamp < STAC_AGGREGATIONS_CACHE_TTL) {
    // eslint-disable-next-line no-console
    console.log('[fetchSTACAggregations] ✓ Returning CACHED result for:', projectName);
    return Promise.resolve(cached.result);
  }

  // Return in-flight promise if already fetching
  if (cached?.promise) {
    // eslint-disable-next-line no-console
    console.log('[fetchSTACAggregations] ⏳ Returning IN-FLIGHT promise for:', projectName);
    return cached.promise;
  }

  // eslint-disable-next-line no-console
  console.log('[fetchSTACAggregations] → Making NEW request for:', projectName);

  // No cache hit, fetch from API
  const aggregationsList = getAggregationsList(projectName);

  const payload = {
    collections: [projectName],
    aggregations: aggregationsList,
    filter,
  };

  const promise = axios
    .post(`${apiRoutes.esgfAggregationsSTAC.path}`, payload)
    .then((res) => {
      // eslint-disable-next-line no-console
      console.log('[fetchSTACAggregations] ✓ Request completed for:', projectName);
      const data = res.data as StacAggregations;
      // Cache the result with timestamp
      stacAggregationsCache.set(cacheKey, {
        result: data,
        timestamp: Date.now(),
      });
      return data;
    })
    .catch((error: ResponseError) => {
      // Clear the promise on error so it can be retried
      const entry = stacAggregationsCache.get(cacheKey);
      if (entry) {
        entry.promise = undefined;
      }
      throw new Error(errorMsgBasedOnHTTPStatusCode(error, apiRoutes.esgfAggregationsSTAC));
    });

  // Cache the in-flight promise
  stacAggregationsCache.set(cacheKey, { promise });

  return promise;
};

export const fetchSTACSearchResults = async (
  reqUrlStr: string,
  projectName: string,
  token?: string,
): Promise<SearchResults> => {
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
    SEARCH_BATCH_SIZE,
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
): Promise<SearchResults> => {
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

  // eslint-disable-next-line no-console
  console.log('[fetchSearchResults] tokenToUse:', tokenToUse, 'type:', typeof tokenToUse);

  // Get cached search results - but skip cache if we have a token (STAC pagination)
  if (!tokenToUse) {
    const cachedResults = getCachedSearchResults();
    /* istanbul ignore next -- @preserve */
    const cachedURL = (cachedResults?.cachedURL as string) || '';

    // eslint-disable-next-line no-console
    console.log('[fetchSearchResults] Checking localStorage cache');
    // eslint-disable-next-line no-console
    console.log('[fetchSearchResults] Request URL:', reqUrlStr);
    // eslint-disable-next-line no-console
    console.log('[fetchSearchResults] Cached URL:', cachedURL);

    // If request URL matches the one in local storage, return the cached results
    if (reqUrlStr === cachedURL) {
      // eslint-disable-next-line no-console
      console.log('[fetchSearchResults] ✓ Returning LOCALSTORAGE cached results');
      return cachedResults;
    }

    // eslint-disable-next-line no-console
    console.log('[fetchSearchResults] ✗ URL mismatch, will fetch fresh data');
  } else {
    // eslint-disable-next-line no-console
    console.log('[fetchSearchResults] Skipping localStorage check (has token)');
  }

  const cachedPagination = getCachedPagination();
  const finalUrl = reqUrlStr;

  if (finalUrl.includes('/stac/search?')) {
    // If the request URL is for STAC search, fetch results using the STAC API
    const params = new URLSearchParams(reqUrlStr.split('?')[1]);
    /* istanbul ignore next -- @preserve */
    const projectName = params.get('project_id') || 'CMIP6';

    // eslint-disable-next-line no-console
    console.log('[fetchSearchResults] URL says project_id:', params.get('project_id'));
    // eslint-disable-next-line no-console
    console.log('[fetchSearchResults] → Fetching STAC results for project:', projectName);

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

  // Extract offset and limit from URL
  const urlParams = new URLSearchParams(finalUrl.split('?')[1]);
  const requestedOffset = parseInt(urlParams.get('offset') || '0', 10);
  const requestedLimit = parseInt(urlParams.get('limit') || '0', 10);

  // Calculate which batch this request falls into
  const batchOffset = Math.floor(requestedOffset / SEARCH_BATCH_SIZE) * SEARCH_BATCH_SIZE;

  // Create a normalized URL for caching (without offset/limit for batch key)
  const normalizedUrl = finalUrl.replace(/[&?]offset=\d+/, '').replace(/[&?]limit=\d+/, '');

  // Build the batch URL (fetch full batch of STAC_BATCH_SIZE)
  const batchUrl = finalUrl
    .replace(/offset=\d+/, `offset=${batchOffset}`)
    .replace(/limit=\d+/, `limit=${SEARCH_BATCH_SIZE}`);

  // Helper function to slice batch results for the requested page
  const sliceBatchForPage = (batchResults: NonStacSearchResponse): NonStacSearchResponse => {
    if (!batchResults.response) return batchResults;

    // If limit is 0 or not specified, return all results without slicing
    if (requestedLimit === 0) {
      return batchResults;
    }

    const startIndex = requestedOffset - batchOffset;
    const endIndex = startIndex + requestedLimit;
    const slicedDocs = batchResults.response.docs.slice(startIndex, endIndex);

    return {
      ...batchResults,
      response: {
        ...batchResults.response,
        docs: slicedDocs,
      },
    };
  };

  // Check batch cache before making API call
  const cachedBatch = getCachedNonStacBatch(normalizedUrl, batchOffset);
  if (cachedBatch?.results) {
    const fullBatch = cachedBatch.results as NonStacSearchResponse;
    const slicedResults = sliceBatchForPage(fullBatch);
    return Promise.resolve(slicedResults as SearchResults);
  }

  // Fetch the batch from the API
  return fetch(batchUrl)
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

      return results.json() as Promise<NonStacSearchResponse>;
    })
    .then((resultsJson: NonStacSearchResponse) => {
      // Cache the full batch
      if (resultsJson.response) {
        const { numFound } = resultsJson.response;
        cacheNonStacBatch(normalizedUrl, batchOffset, resultsJson, numFound);
      }

      // Return only the requested page slice
      const slicedResults = sliceBatchForPage(resultsJson);
      return slicedResults as SearchResults;
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
}): Promise<SearchResults> =>
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
