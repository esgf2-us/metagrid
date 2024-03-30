import { CSSProperties, ReactNode } from 'react';
import { MessageInstance } from 'antd/es/message/interface';
import { UserSearchQueries, UserSearchQuery } from '../components/Cart/types';
import { ActiveFacets } from '../components/Facets/types';
import {
  ActiveSearchQuery,
  RawSearchResult,
  RawSearchResults,
  ResultType,
  TextInputs,
  VersionType,
} from '../components/Search/types';
import messageDisplayData from '../components/Messaging/messageDisplayData';

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
  }
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

  switch (config?.type) {
    case 'success':
      await msgApi.success(msgConfig);
      /* istanbul ignore next */
      return;
    case 'warning':
      await msgApi.warning(msgConfig);
      /* istanbul ignore next */
      return;
    case 'error':
      await msgApi.error(msgConfig);
      /* istanbul ignore next */
      return;
    case 'info':
      await msgApi.info(msgConfig);
      /* istanbul ignore next */
      return;
    default:
      await msgApi.info(msgConfig);
      /* istanbul ignore next */
      break;
  }
}

export async function showError(
  msgApi: MessageInstance,
  errorMsg: React.ReactNode | string
): Promise<void> {
  let msg = errorMsg;
  /* istanbul ignore next */
  if (!errorMsg || errorMsg === '') {
    msg = 'An unknown error has occurred.';
  }
  await showNotice(msgApi, msg, { duration: 5, type: 'error' });
}

/**
 * Checks if an object is empty.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const objectIsEmpty = (obj: Record<any, any>): boolean =>
  !obj || Object.keys(obj).length === 0;

/**
 * Checks if the specified key is in the object
 */
export const objectHasKey = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  obj: Record<any, any>,
  key: string | number
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
  returnIndex?: '0' | '1' | '2'
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
  obj2: { [key: string]: any }
): boolean =>
  Object.keys(obj1).length === Object.keys(obj2).length &&
  Object.keys(obj1).every(
    (key) => obj2.hasOwnProperty.call(obj2, key) && obj1[key] === obj2[key]
  );

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

  if (
    Array.isArray(newSearch.filenameVars) &&
    newSearch.filenameVars.length > 0
  ) {
    params.set('filenameVars', JSON.stringify(newSearch.filenameVars));
  }

  if (
    newSearch.activeFacets &&
    typeof newSearch.activeFacets === 'object' &&
    Object.keys(newSearch.activeFacets).length > 0
  ) {
    // Convert array values to string if they are of size 1
    Object.keys(search.activeFacets).forEach((key) => {
      if ((newSearch.activeFacets[key] as string[]).length === 1) {
        // eslint-disable-next-line
        newSearch.activeFacets[key] = (search.activeFacets[key] as string[])[0];
      }
    });
    params.set('activeFacets', JSON.stringify(newSearch.activeFacets));
  }

  if (Array.isArray(newSearch.textInputs) && newSearch.textInputs.length > 0) {
    params.set('textInputs', JSON.stringify(newSearch.textInputs));
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
  };

  const params = new URLSearchParams(url || window.location.search);
  // eslint-disable-next-line
  const paramEntries: { [k: string]: string } = Object.fromEntries(
    params.entries()
  );
  // eslint-disable-next-line
  const activeFacets: { [k: string]: string[] } = {};
  Object.keys(paramEntries).forEach((key: string) => {
    activeFacets[key] = [paramEntries[key]];
  });

  // eslint-disable-next-line
  const projName = (url || window.location.pathname)
    .split('/')
    .filter(Boolean)
    .at(-1);

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
  };

  const params = new URLSearchParams(url || window.location.search);

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
          // eslint-disable-next-line
          searchQuery.activeFacets[key] = [
            searchQuery.activeFacets[key],
          ] as string[];
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

export const combineCarts = (
  databaseItems: RawSearchResults,
  localItems: RawSearchResults
): RawSearchResults => {
  const itemsNotInDatabase = localItems.filter(
    (item: RawSearchResult) =>
      !databaseItems.some((dataset) => dataset.id === item.id)
  );
  const combinedItems = databaseItems.concat(itemsNotInDatabase);
  return combinedItems;
};

const convertSearchToHash = (query: UserSearchQuery): number => {
  /* eslint-disable */
  let hash: number = 0;
  const nonUniqueQuery: UserSearchQuery = { ...query, uuid: '', user: null };
  const queryStr = JSON.stringify(nonUniqueQuery);
  let i, chr;

  for (i = 0; i < queryStr.length; i++) {
    chr = queryStr.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
};

export const searchAlreadyExists = (
  existingSearches: UserSearchQueries,
  newSearch: UserSearchQuery
): boolean => {
  const hashValueLocal = convertSearchToHash(newSearch);
  return existingSearches.some((search) => {
    if (search.uuid === newSearch.uuid) {
      return true;
    }
    const hashValueDatabase = convertSearchToHash(search);

    return hashValueDatabase === hashValueLocal;
  });
};

export const unsavedLocalSearches = (
  databaseItems: UserSearchQueries,
  localItems: UserSearchQueries
): UserSearchQueries => {
  const itemsNotInDatabase = localItems.filter(
    (localSearchQuery: UserSearchQuery) =>
      !searchAlreadyExists(databaseItems, localSearchQuery)
  );
  return itemsNotInDatabase;
};

export const getLastMessageSeen = (): string | null => {
  return localStorage.getItem('lastMessageSeen');
};

export const setStartupMessageAsSeen = (): void => {
  localStorage.setItem('lastMessageSeen', messageDisplayData.messageToShow);
};
