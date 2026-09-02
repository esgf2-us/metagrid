import { CSSProperties, ReactNode } from 'react';
import { MessageInstance } from 'antd/es/message/interface';
import LZString from 'lz-string';
import { UserSearchQueries, UserSearchQuery } from '../components/Cart/types';
import { ActiveFacets, RawProject } from '../components/Facets/types';
import {
  ActiveSearchQuery,
  Pagination,
  RawSearchResult,
  RawSearchResults,
  ResultType,
  SearchResults,
  StacBatchLoading,
  TextInputs,
  VersionType,
} from '../components/Search/types';
import messageDisplayData from '../components/Messaging/messageDisplayData';
import { AppPage, CSSinJS } from './types';

export type NotificationType = 'success' | 'info' | 'warning' | 'error';

export async function showNotice(
  msgApi: MessageInstance,
  content: React.ReactNode | string,
  config?: {
    duration?: number;
    icon?: ReactNode;
    type?: NotificationType;
    style?: CSSProperties;
    key?: string | number;
  },
): Promise<void> {
  const msgConfig = {
    content,
    duration: config?.duration,
    icon: config?.icon,
    style: {
      marginTop: '60px',
      overflow: 'auto',
      ...config?.style,
    },
    key: config?.key,
  };

  // allow only one message at a time
  msgApi.destroy();

  /* istanbul ignore next -- @preserve */
  switch (config?.type) {
    case 'success':
      await msgApi.success(msgConfig);
      return;
    case 'warning':
      await msgApi.warning(msgConfig);
      return;
    case 'error':
      await msgApi.error(msgConfig);
      return;
    case 'info':
      await msgApi.info(msgConfig);
      return;
    default:
      await msgApi.info(msgConfig);
      break;
  }
}

export const projectBaseQuery = (
  project: Record<string, unknown> | RawProject,
): ActiveSearchQuery => ({
  project,
  versionType: 'latest',
  resultType: 'all',
  minVersionDate: null,
  maxVersionDate: null,
  minCreatedDate: null,
  maxCreatedDate: null,
  filenameVars: [],
  activeFacets: {},
  textInputs: [],
  globusOnly: false,
});

/**
 * Checks if an object is empty.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const objectIsEmpty = (obj: Record<any, any>): boolean =>
  !obj || Object.keys(obj).length === 0;

/**
 * Deep equality comparison using JSON serialization.
 * Useful for comparing objects, arrays, or primitives.
 * @param a - First value to compare
 * @param b - Second value to compare
 * @param normalize - Optional function to normalize values before comparison (e.g., to exclude certain properties)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isEqual = (a: any, b: any, normalize?: (value: any) => any): boolean => {
  const valueA = normalize ? normalize(a) : a;
  const valueB = normalize ? normalize(b) : b;

  return JSON.stringify(valueA) === JSON.stringify(valueB);
};

const bodySider = {
  padding: '12px 12px 12px 12px',
  width: '400px',
  marginRight: '2px',
};

const bodySiderDark = {
  background: 'rgba(255, 255, 255, 0.1)',
};
const bodySiderLight = {
  background: 'rgba(255, 255, 255, 0.9)',
  boxShadow: '2px 0 4px 0 rgba(0, 0, 0, 0.2)',
};

// Provides appropriate styling based on current theme
export function getStyle(isDark: boolean): CSSinJS {
  const colorsToUse = isDark ? bodySiderDark : bodySiderLight;
  const styles: CSSinJS = {
    bodySider: {
      ...bodySider,
      ...colorsToUse,
    },
    bodyContent: { padding: '12px 12px', margin: 0 },
    messageAddIcon: { color: '#90EE90' },
    messageRemoveIcon: { color: '#ff0000' },
  };

  return styles;
}

export async function showError(
  msgApi: MessageInstance,
  errorMsg: React.ReactNode | string,
): Promise<void> {
  let msg = errorMsg;

  /* istanbul ignore next -- @preserve */
  if (!errorMsg || errorMsg === '') {
    msg = 'An unknown error has occurred.';
  }
  await showNotice(msgApi, msg, { duration: 5, type: 'error' });
}

export const getCurrentAppPage = (): AppPage => {
  const { pathname } = window.location;
  if (pathname.endsWith('/search') || pathname.includes('/search/')) {
    return AppPage.Main;
  }
  if (pathname.endsWith('/cart/items')) {
    return AppPage.Cart;
  }
  if (pathname.endsWith('/nodes')) {
    return AppPage.NodeStatus;
  }
  if (pathname.endsWith('/cart/searches')) {
    return AppPage.SavedSearches;
  }
  return AppPage.Unknown;
};

/**
 * Creates a route that will access the JSON search results
 * @param url - The internal search URL
 * @param stacFilter - Optional STAC filter object (required for STAC searches)
 */
export const createSearchRouteURL = (
  url: string,
  stacFilter?: { op: string; args: unknown } | null,
  stacApiUrl?: string,
): string => {
  // Detect if this is a STAC search URL
  const isStacUrl = url.includes('/stac/search');

  const urlObj = new URL(url);
  const { searchParams } = urlObj;

  if (!isStacUrl) {
    return `${window.METAGRID.SEARCH_URL}?${searchParams.toString()}`;
  }

  // STAC: Convert to external STAC API format
  const newParams = new URLSearchParams();

  // Get project name from project_id parameter
  const projectId = searchParams.get('project_id');
  if (projectId) {
    newParams.set('collections', projectId);
  }

  // Get limit (remove offset as STAC API doesn't use it, uses token-based pagination instead)
  const limit = searchParams.get('limit');
  if (limit) {
    newParams.set('limit', limit);
  }

  // Add STAC filter if provided
  if (stacFilter) {
    // URL-encode the filter object as JSON
    newParams.set('filter', JSON.stringify(stacFilter));
    newParams.set('filter-lang', 'cql2-json');
  }

  // Handle text search query parameter
  const query = searchParams.get('query');
  if (query && query !== '*') {
    newParams.set('q', query);
  }

  // Use project-specific STAC URL if provided, otherwise use default
  const baseUrl = stacApiUrl || window.METAGRID.STAC_URL;
  return `${baseUrl}/search?${newParams.toString()}`;
};

/**
 * Checks if the specified key is in the object
 */
export const objectHasKey = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  obj: Record<any, any>,
  key: string | number,
): boolean => Object.prototype.hasOwnProperty.call(obj, key);

/**
 * For a record's 'xlink' attribute, it will be split into an array of
 * three strings.
 *
 * xlink URL example: 'http://cera-www.dkrz.de/WDCC/meta/CMIP6/CMIP6.ScenarioMIP.CCCma.CanESM5.ssp126.r12i1p2f1.day.clt.gn.v20190429.json|Citation|citation'
 * Output split by '|': ['http://cera-www.dkrz.de/WDCC/meta/CMIP6/CMIP6.ScenarioMIP.CCCma.CanESM5.ssp126.r12i1p2f1.day.clt.gn.v20190429.json', 'Citation', 'citation])
 *
 */
export const splitStringByChar = (
  url: string,
  char: '|' | '.json' | ':',
  returnIndex?: '0' | '1' | '2',
): string[] | string => {
  const splitURL = url.split(char);

  if (returnIndex) {
    const returnIndexNum = Number(returnIndex);
    if (splitURL[returnIndexNum] === undefined) {
      throw new Error('Index does not exist in array of URLs');
    }
    return splitURL[returnIndexNum];
  }

  return splitURL;
};

/**
 * Performs a shallow comparison between two objects to check if they are equal.
 * https://stackoverflow.com/a/52323412
 */
export const shallowCompareObjects = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  obj1: { [key: string]: any },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  obj2: { [key: string]: any },
): boolean =>
  Object.keys(obj1).length === Object.keys(obj2).length &&
  Object.keys(obj1).every((key) => obj2.hasOwnProperty.call(obj2, key) && obj1[key] === obj2[key]);

/**
 * Converts binary bytes into another size
 * https://stackoverflow.com/a/18650828
 */
export const formatBytes = (bytes: number, decimals = 2): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / k ** i).toFixed(dm))} ${sizes[i]}`;
};

/**
 * replica param indicates whether the record is the 'master' copy, or a replica.
 * - By default, no replica param is specified (return both replicas and originals)
 * - replica=false to return only originals
 * - replica=true to return only replicas
 *
 * https://github.com/ESGF/esgf.github.io/wiki/ESGF_Search_REST_API#core-facets
 */
export const convertResultTypeToReplicaParam = (
  resultType: ResultType,
  isLabel?: boolean,
): string | undefined => {
  const replicaParams = {
    all: undefined,
    'originals only': 'replica=false',
    'replicas only': 'replica=true',
  };

  const param = replicaParams[resultType] as ResultType;
  return param && isLabel ? param.replace('=', ' = ') : param;
};

export const getUrlFromSearch = (search: ActiveSearchQuery): string => {
  const urlString = `${window.location.protocol}//${window.location.host}${window.location.pathname}`;

  if (!search.project) {
    return urlString;
  }

  const params = new URLSearchParams();
  const newSearch = { ...search };

  params.set('project', newSearch.project.name as string);

  if (newSearch.versionType !== 'latest') {
    params.set('versionType', newSearch.versionType);
  }

  if (newSearch.resultType !== 'all') {
    params.set('resultType', newSearch.resultType);
  }

  if (newSearch.minVersionDate) {
    params.set('minVersionDate', newSearch.minVersionDate);
  }

  if (newSearch.maxVersionDate) {
    params.set('maxVersionDate', newSearch.maxVersionDate);
  }

  if (Array.isArray(newSearch.filenameVars) && newSearch.filenameVars.length > 0) {
    params.set('filenameVars', JSON.stringify(newSearch.filenameVars));
  }

  if (
    newSearch.activeFacets &&
    typeof newSearch.activeFacets === 'object' &&
    Object.keys(newSearch.activeFacets).length > 0
  ) {
    // Convert array values to string if they are of size 1
    const facetsToStringify: { [x: string]: string[] | string } = { ...newSearch.activeFacets };
    Object.keys(newSearch.activeFacets).forEach((key) => {
      if (newSearch.activeFacets[key].length === 1) {
        facetsToStringify[key] = newSearch.activeFacets[key][0] as unknown as string;
      }
    });
    params.set('activeFacets', JSON.stringify(facetsToStringify));
  }

  if (Array.isArray(newSearch.textInputs) && newSearch.textInputs.length > 0) {
    params.set('textInputs', JSON.stringify(newSearch.textInputs));
  }

  if (newSearch.minCreatedDate) {
    params.set('minCreatedDate', newSearch.minCreatedDate);
  }

  if (newSearch.maxCreatedDate) {
    params.set('maxCreatedDate', newSearch.maxCreatedDate);
  }

  if (newSearch.globusOnly) {
    params.set('globusOnly', 'true');
  }

  return `${urlString}?${params.toString()}`;
};

export const getAltSearchFromUrl = (url?: string): ActiveSearchQuery => {
  let searchQuery: ActiveSearchQuery = {
    project: {},
    versionType: 'latest',
    resultType: 'all',
    minVersionDate: null,
    maxVersionDate: null,
    filenameVars: [],
    activeFacets: {},
    textInputs: [],
    globusOnly: false,
    minCreatedDate: null,
    maxCreatedDate: null,
  };

  const params = new URLSearchParams(url || window.location.search);

  const paramEntries: { [k: string]: string } = Object.fromEntries(params.entries());

  const activeFacets: { [k: string]: string[] } = {};
  Object.keys(paramEntries).forEach((key: string) => {
    activeFacets[key] = [paramEntries[key]];
  });

  const pathname = url || window.location.pathname;
  // Only extract project name from pathname if we're on a search-related route
  const isSearchRoute = pathname.includes('/search');
  const projName = isSearchRoute ? pathname.split('/').filter(Boolean).at(-1) : undefined;

  if (projName) {
    searchQuery = { ...searchQuery, project: { name: projName }, activeFacets };
  }

  return searchQuery;
};

export const getSearchFromUrl = (url?: string): ActiveSearchQuery => {
  const searchQuery: ActiveSearchQuery = {
    project: {},
    versionType: 'latest',
    resultType: 'all',
    minVersionDate: null,
    maxVersionDate: null,
    filenameVars: [],
    activeFacets: {},
    textInputs: [],
    globusOnly: false,
    minCreatedDate: null,
    maxCreatedDate: null,
  };

  const params = new URLSearchParams(url || window.location.search);

  if (params.size < 1) {
    return searchQuery;
  }

  const projName = params.get('project');
  const versionType = params.get('versionType');
  const resultType = params.get('resultType');
  const minVersionDate = params.get('minVersionDate');
  const maxVersionDate = params.get('maxVersionDate');
  const filenameVars = params.get('filenameVars');
  const activeFacets = params.get('activeFacets');
  const textInputs = params.get('textInputs');

  if (projName) {
    if (versionType) {
      searchQuery.versionType = versionType as VersionType;
    }
    if (resultType) {
      searchQuery.resultType = resultType as ResultType;
    }
    if (minVersionDate) {
      searchQuery.minVersionDate = minVersionDate;
    }
    if (maxVersionDate) {
      searchQuery.maxVersionDate = maxVersionDate;
    }
    if (filenameVars) {
      searchQuery.filenameVars = JSON.parse(filenameVars) as TextInputs;
    }
    if (activeFacets) {
      searchQuery.activeFacets = JSON.parse(activeFacets) as ActiveFacets;

      // Convert string values to array
      Object.keys(searchQuery.activeFacets).forEach((key) => {
        if (!Array.isArray(searchQuery.activeFacets[key])) {
          searchQuery.activeFacets[key] = [searchQuery.activeFacets[key]] as string[];
        }
      });
    }
    if (textInputs) {
      searchQuery.textInputs = JSON.parse(textInputs) as TextInputs;
    }

    return { ...searchQuery, project: { name: projName } };
  }

  return getAltSearchFromUrl(url);
};

export function createEsgpullCommand(
  searchQuery: ActiveSearchQuery | Record<string, unknown>,
  downloadCmd: boolean,
  datasetId?: string,
): string {
  // If it's a single dataset, just use dataset_id
  if (datasetId && datasetId !== '') {
    return `# Esgpull Dataset Download Command:\n\`esgpull add master_id:'"${datasetId}"' --track | tail -n1\`; esgpull download --disable-ssl`;
  }

  if (objectIsEmpty(searchQuery)) {
    return '';
  }

  const { project, versionType, resultType, activeFacets, textInputs } =
    searchQuery as ActiveSearchQuery;

  // Commented out values were causing KeyError during search
  const validFacets: string[] = [
    'activity_id',
    'data_node',
    'dataset_id',
    'experiment_id',
    'frequency',
    'grid_label',
    'index_node',
    'institution_id',
    'master_id',
    'member_id',
    'mip_era',
    'nominal_resolution',
    'project',
    'realm',
    'source_id',
    'table_id',
    'title',
    'url',
    'variable',
    'variable_id',
    'variable_long_name',
    'variant_label',
  ];
  const commandParts: string[] = [];

  // Add project name
  /* istanbul ignore else -- @preserve */
  if (project) {
    if (project.isSTAC && project.projectName) {
      commandParts.push(`project:'"${(project as RawProject).projectName}"'`);
    } else if (project.name) {
      commandParts.push(`project:'"${(project as RawProject).name}"'`);
    }
  }

  // Check if some facets are invalid
  const invalidFacets: string[] = [];

  // Add other search parameters
  if (!objectIsEmpty(activeFacets)) {
    Object.entries(activeFacets).forEach(([key, value]) => {
      if (validFacets.includes(key) && value.length > 0) {
        commandParts.push(`${key}:'"${value.join(',')}"'`);
      } else {
        invalidFacets.push(`${key}:'"${value.join(',')}"'`);
      }
    });
  }

  // Add text inputs
  if (textInputs.length > 0) {
    commandParts.push(`${JSON.stringify(textInputs)}`);
  }

  // Update result type
  if (versionType && versionType === 'latest') {
    commandParts.push(`--latest true`);
  }

  // Update result type
  if (resultType && resultType !== 'all') {
    if (resultType === 'originals only') {
      commandParts.push(`--replica false`);
    } else {
      commandParts.push(`--replica true`);
    }
  }

  const ignoredFacetsMsg =
    invalidFacets.length > 0
      ? `#${'='.repeat(79)}\n# Facets listed below WERE NOT applied (not supported in Esgpull):\n# UNAPPLIED: ${invalidFacets.join('\n# UNAPPLIED: ')}\n#${'='.repeat(79)}\n`
      : '';
  const pullCmd = `esgpull ${downloadCmd ? 'add' : 'search'} ${commandParts.join(' ')}`;

  if (downloadCmd) {
    return `${ignoredFacetsMsg}# Espull Download Command:\n\`${pullCmd} --track | tail -n1\`; esgpull download --disable-ssl`;
  }

  return `${ignoredFacetsMsg}# Esgpull Search Query:\n${pullCmd}`;
}

export const createIntakeEsgfSearch = (searchQuery: ActiveSearchQuery): string => {
  const { versionType, activeFacets, project } = searchQuery;

  const commandParts: string[] = [];

  // Add project parameter (intake-esgf defaults to CMIP6 if not specified)
  const projectName = (project.name as string)?.toLowerCase();
  if (projectName && !project.isSTAC) {
    commandParts.push(`project='${projectName}'`);
  }

  // Facets to exclude from intake-esgf (node-specific or intake-esgf handles differently)
  const excludedFacets = ['data_node', 'index_node'];

  /* istanbul ignore else -- @preserve */
  if (!objectIsEmpty(activeFacets)) {
    Object.entries(activeFacets).forEach(([key, value]) => {
      // Skip excluded facets
      if (excludedFacets.includes(key)) {
        return;
      }
      /* istanbul ignore else -- @preserve */
      if (value.length > 1) {
        commandParts.push(`${key}=['${value.join("', '")}']`);
      } else if (value.length === 1) {
        commandParts.push(`${key}='${value[0]}'`);
      }
    });
  }

  // Update result type
  if (versionType && versionType === 'all') {
    commandParts.push(`latest=False`);
  } else {
    commandParts.push(`latest=True`);
  }

  const intakeImports = `import intake_esgf\nfrom intake_esgf import supported_projects\n\n`;

  const projectValidation = project.isSTAC
    ? ''
    : `# Validate project is supported by intake-esgf
supported = supported_projects()
project_name = '${projectName}'
if project_name not in supported:
    print(f"Warning: '{project_name}' not in supported projects: {supported}")
    print("Attempting search anyway...")

`;

  const confSettings = project.isSTAC
    ? `intake_esgf.conf.set(indices={"${window.METAGRID.STAC_URL}":True})\n`
    : `intake_esgf.conf.set(all_indices=True)\n`;

  const catalogCmd = `\ncat=intake_esgf.ESGFCatalog()\n\n`;

  const searchCmd =
    commandParts.length > 0
      ? `try:
    metagrid_search=cat.search(${commandParts.join(', ')})
    print(metagrid_search)
except Exception as e:
    print(f"Search failed: {e}")
    print("Tip: Facet names may differ between the web interface and intake-esgf.")
    print("Try removing some facets or checking intake-esgf documentation.")`
      : `metagrid_search=cat.search(latest=True)\nprint(metagrid_search)`;

  return `${intakeImports}${projectValidation}${confSettings}${catalogCmd}${searchCmd}`;
};

export const combineCarts = (
  databaseItems: RawSearchResults,
  localItems: RawSearchResults,
): RawSearchResults => {
  const itemsNotInDatabase = localItems.filter(
    (item: RawSearchResult) => !databaseItems.some((dataset) => dataset.id === item.id),
  );
  const combinedItems = databaseItems.concat(itemsNotInDatabase);
  return combinedItems;
};

/**
 * Generates a 32-bit hash from any value using JSON serialization.
 * Useful for creating efficient comparison keys for complex objects.
 * @param value - The value to hash (will be JSON stringified)
 * @param normalize - Optional function to normalize the value before hashing
 * @returns A 32-bit integer hash
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const hashObject = (value: any, normalize?: (val: any) => any): number => {
  /* eslint-disable */
  let hash: number = 0;
  const normalizedValue = normalize ? normalize(value) : value;
  const valueStr = JSON.stringify(normalizedValue);
  let i, chr;

  for (i = 0; i < valueStr.length; i++) {
    chr = valueStr.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
};

export const searchAlreadyExists = (
  existingSearches: UserSearchQueries,
  newSearch: UserSearchQuery,
): boolean => {
  return existingSearches.some((search) => {
    if (search.uuid === newSearch.uuid) {
      return true;
    }

    // Normalize a search query by removing instance-specific properties
    // that don't affect the search semantics (uuid, timestamps, user, etc.)
    const normalizeSearchQuery = (query: UserSearchQuery): Partial<UserSearchQuery> => ({
      ...query,
      resultsCount: 0,
      searchTime: null,
      uuid: '',
      user: null,
      url: '',
    });

    return isEqual(search, newSearch, normalizeSearchQuery);
  });
};

export const unsavedLocalSearches = (
  databaseItems: UserSearchQueries,
  localItems: UserSearchQueries,
): UserSearchQueries => {
  const itemsNotInDatabase = localItems.filter(
    (localSearchQuery: UserSearchQuery) => !searchAlreadyExists(databaseItems, localSearchQuery),
  );
  return itemsNotInDatabase;
};

export const getLastMessageSeen = (): string | null => {
  return localStorage.getItem('lastMessageSeen');
};

export const setStartupMessageAsSeen = (): void => {
  localStorage.setItem('lastMessageSeen', messageDisplayData.messageToShow);
};

// This is meant to clear out any deprecated keys in localStorage
// that are no longer used in the application.
export const clearDeprecatedStorageKeys = (): void => {
  const deprecatedLocalStorageKeys = ['userSearchQuery', 'showBanner'];

  deprecatedLocalStorageKeys.forEach((key) => {
    if (localStorage.getItem(key)) {
      localStorage.removeItem(key);
    }
  });
};

export const getStrSizeInKb = (str: string): number => {
  // Convert the string to a Blob and get its size
  const sizeInBytes = new Blob([str]).size;
  // Convert bytes to kilobytes
  return sizeInBytes / 1024;
};

export function compressData<T>(data: T): string {
  const jsonStr = JSON.stringify(data);
  const compressedData = LZString.compress(jsonStr);

  return compressedData;
}

export function decompressData<T>(compressedStr: string): T {
  // Decompress the data
  const decompressedStr = LZString.decompress(compressedStr);
  const decompressedData = JSON.parse(decompressedStr);
  return decompressedData as T;
}

export function saveToLocalStorage<T>(key: string, value: T, compress = false): void {
  if (compress) {
    const compressedValue = compressData<T>(value);
    localStorage.setItem(key, compressedValue);
    return;
  }

  const jsonStr = JSON.stringify(value);
  localStorage.setItem(key, jsonStr);
}

export function getFromLocalStorage<T>(key: string, decompress = false): T | null {
  if (decompress) {
    const value = localStorage.getItem(key);
    if (!value) {
      return null;
    }
    // Decompress the data
    const decompressedValue = decompressData<T>(value);
    return decompressedValue;
  }

  const value = localStorage.getItem(key);
  return value ? (JSON.parse(value) as T) : null;
}

export const cachePagination = (pagination: Pagination): void => {
  saveToLocalStorage('cachedSearchPagination', pagination);
};

export const getCachedPagination = (): Pagination => {
  return (
    getFromLocalStorage<Pagination>('cachedSearchPagination') || {
      page: 1,
      pageSize: 10,
    }
  );
};

export const cacheSearchResults = (
  fetchedResults: SearchResults | undefined,
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
    cachePagination(pagination);
  }
};

export const getCachedSearchResults = (): SearchResults => {
  const fetchedResults: SearchResults =
    (getFromLocalStorage('cachedSearchResults', true) as SearchResults) || {};
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

export const clearCachedSearchResults = (): void => {
  // Clear the cached search results from localStorage
  localStorage.removeItem('cachedSearchResults');
  localStorage.removeItem('cachedSearchPagination');
};

// STAC batch cache functions
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

export const getCachedStacBatches = (): StacBatchLoading | null => {
  const cached = getFromLocalStorage('cachedStacBatches', true) as {
    batches?: StacBatchLoading;
    expires?: number;
  } | null;

  if (!cached) return null;

  const now = Date.now();

  if (cached.expires && now > cached.expires) {
    // If expired, remove from localStorage
    clearCachedStacBatches();
    return null;
  }

  // If not expired, return the cached batches
  return cached.batches || null;
};

export const clearCachedStacBatches = (): void => {
  localStorage.removeItem('cachedStacBatches');
};

// Non-STAC batch cache functions - stores multiple on-demand batches by offset
export type NonStacBatchCache = {
  batches: {
    [offset: number]: {
      results: unknown;
      numFound: number;
      fetchedAt: number;
    };
  };
  searchURL: string;
  expires: number;
};

export const cacheNonStacBatch = (
  searchURL: string,
  offset: number,
  results: unknown,
  numFound: number,
): void => {
  const cached = getNonStacBatchCache();
  const now = Date.now();

  // If the search URL changed, clear old cache and start fresh
  if (cached && cached.searchURL !== searchURL) {
    clearNonStacBatchCache();
  }

  const existingBatches = cached?.searchURL === searchURL ? cached.batches : {};

  saveToLocalStorage(
    'cachedNonStacBatches',
    {
      batches: {
        ...existingBatches,
        [offset]: {
          results,
          numFound,
          fetchedAt: now,
        },
      },
      searchURL,
      expires: now + 60 * 60 * 1000, // Expires after an hour
    },
    true,
  );
};

export const getNonStacBatchCache = (): NonStacBatchCache | null => {
  const cached: Record<string, unknown> = getFromLocalStorage('cachedNonStacBatches', true) || {};
  const now = Date.now();

  if (cached.expires && now > (cached.expires as number)) {
    clearNonStacBatchCache();
    return null;
  }

  return cached as NonStacBatchCache;
};

export const getCachedNonStacBatch = (
  searchURL: string,
  offset: number,
): { results: unknown; numFound: number } | null => {
  const cache = getNonStacBatchCache();

  if (!cache || cache.searchURL !== searchURL) {
    return null;
  }

  const batch = cache.batches[offset];
  if (!batch) {
    return null;
  }

  return {
    results: batch.results,
    numFound: batch.numFound,
  };
};

export const clearNonStacBatchCache = (): void => {
  localStorage.removeItem('cachedNonStacBatches');
};

export const showBanner = (): boolean => {
  const currentBannerText = sessionStorage.getItem('showBanner');

  // Check if the banner should be shown
  if (
    window.METAGRID.BANNER_TEXT !== null &&
    window.METAGRID.BANNER_TEXT !== '' &&
    currentBannerText !== window.METAGRID.BANNER_TEXT
  ) {
    return true;
  }

  if (window.METAGRID.BANNER_TEXT === null || window.METAGRID.BANNER_TEXT === '') {
    sessionStorage.removeItem('showBanner');
  }

  return false;
};

export const saveBannerText = (): void => {
  // Set the banner text in sessionStorage
  const bannerText = window.METAGRID.BANNER_TEXT;

  /* istanbul ignore else -- @preserve */
  if (bannerText) {
    sessionStorage.setItem('showBanner', bannerText);
  }
};

export const downloadFileForUser = (filename: string, fileContent: string): void => {
  const downloadLinkNode = document.createElement('a');
  downloadLinkNode.setAttribute(
    'href',
    `data:text/plain;charset=utf-8,${encodeURIComponent(fileContent)}`,
  );
  downloadLinkNode.setAttribute('download', filename);

  downloadLinkNode.style.display = 'none';
  document.body.appendChild(downloadLinkNode);

  downloadLinkNode.click();

  document.body.removeChild(downloadLinkNode);
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
