import { ActiveSearchQuery, Pagination, RawSearchResults, TextInputs } from './types';
import { UserSearchQueries, UserSearchQuery } from '../Cart/types';
import {
  saveToLocalStorage,
  getFromLocalStorage,
  cachePagination,
  objectIsEmpty,
  getSearchFromUrl,
  memoizeByArgs,
  convertObjectToHash,
} from '../../common/utils';
import { ActiveFacets } from '../Facets/types';

export const SEARCH_BATCH_SIZE = 100;

export type StacBatchLoading = {
  batches: { nextToken: string | undefined; results: RawSearchResults }[];
  projectName: string;
  totalMatched: number;
  searchQuery: ActiveSearchQuery | null;
  searchHash: number;
};

export const cacheSearchResults = (
  fetchedResults: Record<string, unknown> | undefined,
  pagination: Pagination,
  cachedURL: string,
  searchQuery?: ActiveSearchQuery,
): void => {
  if (fetchedResults && !Object.hasOwn(fetchedResults, 'cachedURL')) {
    saveToLocalStorage(
      'cachedSearchResults',
      {
        results: fetchedResults,
        cachedURL,
        searchQuery, // Cache the actual query object instead of trying to parse URL
        expires: Date.now() + 60 * 60 * 1000, // Expires after an hour
      },
      true,
    );

    // Cache the pagination
    // cachePagination(pagination);
  }
};

export const memoizedCacheSearchResults = memoizeByArgs(
  cacheSearchResults,
  (_fetchedResults, cachedURL, searchQuery) =>
    JSON.stringify({
      cachedURL,
      searchQuery,
    }),
);

export const clearCachedSearchResults = (): void => {
  // Clear the cached search results from localStorage
  localStorage.removeItem('cachedSearchResults');
  localStorage.removeItem('cachedSearchPagination');
};

export const getCachedSearchResults = (): Record<string, unknown> => {
  const fetchedResults: Record<string, unknown> =
    getFromLocalStorage('cachedSearchResults', true) || {};
  const now = Date.now();
  if (fetchedResults.expires && now > (fetchedResults.expires as number)) {
    // If expired, remove from session storage
    clearCachedSearchResults();

    return {};
  }

  // If not expired, return the cached results
  return {
    cachedURL: fetchedResults.cachedURL,
    searchQuery: fetchedResults.searchQuery,
    ...(typeof fetchedResults.results === 'object' && fetchedResults.results !== null
      ? fetchedResults.results
      : {}),
  };
};

/**
 * Parses raw facets from the API into a structured format.
 * Joins adjacent elements of the facets object into tuples [facetValue, count].
 */
export const parseFacets = (
  facets: Record<string, (string | number)[]>,
): Record<string, [string, number][]> => {
  const res = facets as unknown as Record<string, [string, number][]>;
  const keys: string[] = Object.keys(facets);

  keys.forEach((key) => {
    res[key] = res[key].reduce(
      (r, a, i) => {
        if (i % 2) {
          r[r.length - 1].push(a as unknown as number);
        } else {
          r.push([a] as never);
        }
        return r;
      },
      [] as unknown as [string, number][],
    );
  });
  return res;
};

/**
 * Checks if any filters (facets or text inputs) are active.
 */
export const checkFiltersExist = (
  activeFacets: ActiveFacets | Record<string, unknown>,
  textInputs: TextInputs,
): boolean => !(objectIsEmpty(activeFacets) && textInputs.length === 0);

/**
 * Identifies facets that might have caused a search error by comparing
 * the current query with the last successful query.
 * Returns a Set of facet keys in the format "facetName:facetValue".
 */
export const identifyProblematicFacets = (
  currentQuery: ActiveSearchQuery,
  lastSuccessfulQuery: ActiveSearchQuery | null,
): Set<string> => {
  const problematicFacets = new Set<string>();

  if (!lastSuccessfulQuery) {
    return problematicFacets;
  }

  const currentFacets = currentQuery.activeFacets;
  const lastFacets = lastSuccessfulQuery.activeFacets;

  // Find facets that are new or have new values
  Object.keys(currentFacets).forEach((facetKey) => {
    const currentValues = currentFacets[facetKey] || [];
    const lastValues = lastFacets[facetKey] || [];

    // Check if this is a new facet key or has new values
    if (!lastFacets[facetKey]) {
      // Entire facet is new
      currentValues.forEach((value) => {
        problematicFacets.add(`${facetKey}:${value}`);
      });
    } else {
      // Check for new values in existing facet
      currentValues.forEach((value) => {
        if (!lastValues.includes(value)) {
          problematicFacets.add(`${facetKey}:${value}`);
        }
      });
    }
  });

  return problematicFacets;
};

export const deriveCachedSearchData = (
  cache: Record<string, unknown>,
): {
  results: Record<string, unknown>;
  query: ActiveSearchQuery | null;
  facets: Record<string, [string, number][]>;
} => {
  let query = cache.searchQuery as ActiveSearchQuery | null;

  // Fallback to URL parsing only for legacy caches or user-shareable URLs
  if (!query) {
    const cachedURL = cache.cachedURL as string;
    query = cachedURL ? getSearchFromUrl(cachedURL) : null;
  }

  let facets: Record<string, [string, number][]> = {};
  if (cache.facet_counts) {
    const { facet_fields: facetFields } = cache.facet_counts as {
      facet_fields: Record<string, (string | number)[]>;
    };
    facets = parseFacets(facetFields);
  } else if (cache.facets) {
    facets = cache.facets as Record<string, [string, number][]>;
  }

  return { results: cache, query, facets };
};

/**
 * Converts an ActiveSearchQuery to a hash number for efficient comparison.
 * Includes all search criteria: facets, text inputs, version filters, result type, etc.
 *
 * @param query - ActiveSearchQuery to hash
 * @returns Hash number representing the search criteria
 */
export const convertActiveSearchToHash = (query: ActiveSearchQuery): number => {
  return convertObjectToHash<ActiveSearchQuery>(query);
};

/**
 * Converts a UserSearchQuery to a hash number for efficient comparison.
 * Excludes non-unique fields like resultsCount, searchTime, uuid, user, and url.
 *
 * @param query - UserSearchQuery to hash
 * @returns Hash number representing the search criteria
 */
export const convertUserSearchQueryToHash = (query: UserSearchQuery): number => {
  const nonUniqueQuery: UserSearchQuery = {
    ...query,
    resultsCount: 0,
    searchTime: null,
    uuid: '',
    user: null,
    url: '',
  };
  return convertObjectToHash<UserSearchQuery>(nonUniqueQuery);
};

/**
 * Compares two ActiveSearchQuery objects to determine if they represent the same search.
 * Uses hash comparison for efficient and comprehensive comparison of all search criteria.
 * @param firstSearch - First search query to compare
 * @param secondSearch - Second search query to compare
 * @returns true if the searches match (same search criteria), false otherwise
 */
export const searchesMatch = (
  firstSearch: ActiveSearchQuery,
  secondSearch: ActiveSearchQuery,
): boolean => {
  return convertActiveSearchToHash(firstSearch) === convertActiveSearchToHash(secondSearch);
};

/**
 * Checks if a search already exists in the list of searches
 */
export const searchAlreadyExists = (
  existingSearches: UserSearchQueries,
  newSearch: UserSearchQuery,
): boolean => {
  const hashValueLocal = convertUserSearchQueryToHash(newSearch);
  return existingSearches.some((search) => {
    if (search.uuid === newSearch.uuid) {
      return true;
    }
    const hashValueDatabase = convertUserSearchQueryToHash(search);

    return hashValueDatabase === hashValueLocal;
  });
};

/**
 * Returns searches that are in local storage but not in the database
 */
export const unsavedLocalSearches = (
  databaseItems: UserSearchQueries,
  localItems: UserSearchQueries,
): UserSearchQueries => {
  const itemsNotInDatabase = localItems.filter(
    (localSearchQuery: UserSearchQuery) => !searchAlreadyExists(databaseItems, localSearchQuery),
  );
  return itemsNotInDatabase;
};

// STAC batch cache functions
export const clearCachedStacBatches = (): void => {
  localStorage.removeItem('cachedStacBatches');
};

export const cacheStacBatches = (stacBatches: StacBatchLoading): void => {
  saveToLocalStorage(
    'cachedStacBatches',
    {
      batches: stacBatches,
      expires: Date.now() + 60 * 60 * 1000, // Expires after an hour
    },
    true,
  );
};

export const getCachedStacBatches = (): Record<string, unknown> | null => {
  const cached: Record<string, unknown> = getFromLocalStorage('cachedStacBatches', true) || {};
  const now = Date.now();

  if (cached.expires && now > (cached.expires as number)) {
    // If expired, remove from localStorage
    clearCachedStacBatches();
    return null;
  }

  // If not expired, return the cached batches
  return (cached.batches as Record<string, unknown>) || null;
};

/**
 * Helper function to create an empty STAC batch state
 */
export const createEmptyStacBatchState = (projectName: string) => ({
  results: [],
  nextToken: undefined,
  projectName,
  totalMatched: 0,
  searchQuery: null,
  cacheRestored: false,
});

/**
 * Helper function to clear all search-related state
 */
export const createSearchResetState = (projectName: string, pageSize: number) => ({
  stacBatches: createEmptyStacBatchState(projectName),
  pagination: { page: 1, pageSize },
  isBackgroundFetch: false,
  lastPreloadedBatch: -1,
  cachedResults: undefined,
  availableFacets: {},
});

/**
 * Helper to determine if STAC results should accumulate or start fresh
 */
export const shouldAccumulateStacResults = (params: {
  isBackgroundFetch: boolean;
  requestQuery: ActiveSearchQuery | null;
  cachedQuery: ActiveSearchQuery | null;
  cachedProjectName: string;
  currentProjectName: string;
  existingResultsLength: number;
}): boolean => {
  const {
    isBackgroundFetch,
    requestQuery,
    cachedQuery,
    cachedProjectName,
    currentProjectName,
    existingResultsLength,
  } = params;

  // If this is a background fetch, always accumulate
  if (isBackgroundFetch) {
    return true;
  }

  // If no existing results, start fresh
  if (existingResultsLength === 0) {
    return false;
  }

  // If project changed, start fresh
  if (cachedProjectName !== currentProjectName) {
    return false;
  }

  // If no cached query or request query, start fresh
  if (!cachedQuery || !requestQuery) {
    return false;
  }

  // Don't accumulate - this is a new search
  return false;
};

/**
 * Helper to check if results should be processed for the current project
 */
export const shouldProcessResults = (
  requestProjectName: string,
  currentProjectName: string,
): boolean => {
  return requestProjectName === currentProjectName;
};

/**
 * Helper to determine if preload should trigger
 */
export const shouldTriggerPreload = (params: {
  currentPage: number;
  loadedCount: number;
  pageSize: number;
  nextToken: string | undefined;
  lastPreloadedBatch: number;
}): { shouldTrigger: boolean; currentBatch: number } => {
  const { currentPage, loadedCount, pageSize, nextToken, lastPreloadedBatch } = params;

  const totalLoadedPages = Math.ceil(loadedCount / pageSize);
  const currentBatch = Math.ceil(loadedCount / SEARCH_BATCH_SIZE);

  const shouldTrigger =
    !!nextToken && currentPage === totalLoadedPages && lastPreloadedBatch !== currentBatch;

  return { shouldTrigger, currentBatch };
};
