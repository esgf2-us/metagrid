import { atomWithStorage } from 'jotai/utils';
import { atom } from 'jotai';
import { UserCart, UserSearchQueries } from '../components/Cart/types';
import { ParsedFacets } from '../components/Facets/types';
import { GlobusTaskItem, GlobusEndpoint } from '../components/Globus/types';
import { NodeStatusArray } from '../components/NodeStatus/types';
import { ActiveSearchQuery, RawSearchResults } from '../components/Search/types';
import { projectBaseQuery } from './utils';

export enum AppStateKeys {
  isDarkMode = 'isDarkMode',
  userCart = 'userCart',
  userSearchQuery = 'userSearchQuery',
  activeSearchQuery = 'activeSearchQuery',
  supportModalVisible = 'supportModalVisible',
  savedSeachQuery = 'savedSeachQuery',
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

export const activeSearchQueryAtom = atom<ActiveSearchQuery>(projectBaseQuery({}));

export const supportModalVisibleAtom = atom<boolean>(false);

export const savedSearchQueryAtom = atom<ActiveSearchQuery | null>(null);

export const availableFacetsAtom = atom<ParsedFacets | Record<string, unknown>>({});

export const nodeStatusAtom = atom<NodeStatusArray>([]);

export const isDarkModeAtom = atomWithStorage<boolean>(
  AppStateKeys.isDarkMode,
  darkModeDefault,
  undefined,
  { getOnInit: true }
);

export const userCartAtom = atomWithStorage<UserCart>(AppStateKeys.userCart, [], undefined, {
  getOnInit: true,
});

export const userSearchQueriesAtom = atomWithStorage<UserSearchQueries>(
  AppStateKeys.userSearchQuery,
  [],
  undefined,
  { getOnInit: true }
);

export const cartDownloadIsLoadingAtom = atomWithStorage<boolean>(
  CartStateKeys.cartDownloadIsLoading,
  false,
  undefined,
  { getOnInit: true }
);

export const cartItemSelectionsAtom = atomWithStorage<RawSearchResults>(
  CartStateKeys.cartItemSelections,
  [],
  undefined,
  { getOnInit: true }
);

export const globusTaskItemsAtom = atomWithStorage<GlobusTaskItem[]>(
  GlobusStateKeys.globusTaskItems,
  [],
  undefined,
  { getOnInit: true }
);

export const savedGlobusEndpointsAtom = atomWithStorage<GlobusEndpoint[]>(
  GlobusStateKeys.savedGlobusEndpoints,
  [],
  undefined,
  { getOnInit: true }
);
