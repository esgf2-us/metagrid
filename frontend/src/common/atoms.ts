import { atomWithStorage } from 'jotai/utils';
import { atom } from 'jotai';
import { UserCart, UserSearchQueries, UserSearchQuery } from '../components/Cart/types';
import { ParsedFacets, RawProject } from '../components/Facets/types';
import { GlobusTaskItem, GlobusEndpoint } from '../components/Globus/types';
import { NodeStatusArray } from '../components/NodeStatus/types';
import { ActiveSearchQuery, RawSearchResults } from '../components/Search/types';
import { projectBaseQuery } from './utils';

export enum AppStateKeys {
  isDarkMode = 'isDarkMode',
  currentProject = 'currentProject',
  userCart = 'userCart',
  nodePreferences = 'nodePreferences',
  userChosenEndpoint = 'userChosenEndpoint',
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
  selectedNodes = 'selectedNodes',
  downloadSelections = 'downloadSelections',
}

export enum GlobusStateKeys {
  accessToken = 'globusAccessToken',
  userChosenEndpoint = 'globusChosenEndpoint',
  globusTransferGoalsState = 'globusTransferGoalsState',
  globusAuthScope = 'globusAuthScope',
  globusTaskItems = 'globusTaskItems',
  transferToken = 'globusTransferToken',
  savedGlobusEndpoints = 'savedGlobusEndpoints',
}

const darkModeDefault =
  typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-color-scheme: dark)').matches
    : false;

export const supportModalVisibleAtom = atom<boolean>(false);

export const savedSearchQueryAtom = atom<UserSearchQuery | undefined>();

export const availableFacetsAtom = atom<ParsedFacets | Record<string, unknown>>({});

export const nodeStatusAtom = atom<NodeStatusArray>([]);

export const nodePreferencesAtom = atomWithStorage<string[]>(
  AppStateKeys.nodePreferences,
  [],
  undefined,
  { getOnInit: true },
);

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

export const currentProjectAtom = atomWithStorage<RawProject>(
  AppStateKeys.currentProject,
  {} as RawProject,
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

export const userChosenEndpointAtom = atomWithStorage<GlobusEndpoint | null>(
  AppStateKeys.userChosenEndpoint,
  null,
  undefined,
  { getOnInit: true },
);

export const selectedNodesAtom = atomWithStorage<Record<string, string>>(
  CartStateKeys.selectedNodes,
  {},
  undefined,
  { getOnInit: true },
);

export const downloadSelectionsAtom = atomWithStorage<
  Record<string, 'wget' | 'Globus' | 'esgpull'>
>(CartStateKeys.downloadSelections, {}, undefined, { getOnInit: true });
