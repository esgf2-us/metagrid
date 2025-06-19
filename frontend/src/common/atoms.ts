import { atomWithStorage } from 'jotai/utils';
import { atom } from 'jotai';
import { UserCart, UserSearchQueries, UserSearchQuery } from '../components/Cart/types';
import { ParsedFacets } from '../components/Facets/types';
import { GlobusTaskItem, GlobusEndpoint } from '../components/Globus/types';
import { NodeStatusArray } from '../components/NodeStatus/types';
import { ActiveSearchQuery, RawSearchResults } from '../components/Search/types';
import { projectBaseQuery } from './utils';

export enum AppStateKeys {
  isDarkMode = 'isDarkMode',
  userCart = 'userCart',
  userSearchQueries = 'userSearchQueries',
  activeSearchQuery = 'activeSearchQuery',
  currentRequestURL = 'currentRequestURL',
  supportModalVisible = 'supportModalVisible',
  savedSearchQuery = 'savedSearchQuery',
  availableFacets = 'availableFacets',
  nodeStatus = 'nodeStatus',
}

export enum CartStateKeys {
  cartItemSelections = 'cartItemSelections',
  cartDownloadIsLoading = 'downloadIsLoading',
}

export enum GlobusStateKeys {
  accessToken = 'globusAccessToken',
  userChosenEndpoint = 'globusChosenEndpoint',
  globusTransferGoalsState = 'globusTransferGoalsState',
  globusAuth = 'globusAuth',
  globusTaskItems = 'globusTaskItems',
  transferToken = 'globusTransferToken',
  savedGlobusEndpoints = 'savedGlobusEndpoints',
}

const darkModeDefault = window.matchMedia('(prefers-color-scheme: dark)').matches;

export const supportModalVisibleAtom = atom<boolean>(false);

export const savedSearchQueryAtom = atom<UserSearchQuery | undefined>();

export const availableFacetsAtom = atom<ParsedFacets | Record<string, unknown>>({});

export const nodeStatusAtom = atom<NodeStatusArray>([]);

export const activeSearchQueryAtom = atomWithStorage<ActiveSearchQuery>(
  AppStateKeys.activeSearchQuery,
  projectBaseQuery({}),
  undefined,
  { getOnInit: true },
);

export const currentRequestQueryAtom = atomWithStorage<string>(
  AppStateKeys.currentRequestURL,
  '',
  undefined,
  { getOnInit: true },
);

export const isDarkModeAtom = atomWithStorage<boolean>(
  AppStateKeys.isDarkMode,
  darkModeDefault,
  undefined,
  { getOnInit: true },
);

export const userCartAtom = atomWithStorage<UserCart>(AppStateKeys.userCart, [], undefined, {
  getOnInit: true,
});

export const userSearchQueriesAtom = atomWithStorage<UserSearchQueries>(
  AppStateKeys.userSearchQueries,
  [],
  undefined,
  { getOnInit: true },
);

export const cartDownloadIsLoadingAtom = atomWithStorage<boolean>(
  CartStateKeys.cartDownloadIsLoading,
  false,
  undefined,
  { getOnInit: true },
);

export const cartItemSelectionsAtom = atomWithStorage<RawSearchResults>(
  CartStateKeys.cartItemSelections,
  [],
  undefined,
  { getOnInit: true },
);

export const globusTaskItemsAtom = atomWithStorage<GlobusTaskItem[]>(
  GlobusStateKeys.globusTaskItems,
  [],
  undefined,
  { getOnInit: true },
);

export const savedGlobusEndpointsAtom = atomWithStorage<GlobusEndpoint[]>(
  GlobusStateKeys.savedGlobusEndpoints,
  [],
  undefined,
  { getOnInit: true },
);
