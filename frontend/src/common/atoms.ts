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

// const darkModeStorageEffect = (key: string): AtomEffect<boolean> => ({ setSelf, onSet }) => {
//   const savedValue = localStorage.getItem(key);
//   if (savedValue != null) {
//     setSelf(savedValue === 'true');
//   } else {
//     const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
//     setSelf(mediaQuery.matches);
//   }

//   onSet((newValue) => {
//     localStorage.setItem(key, newValue.toString());
//   });
// };

// export const isDarkModeAtom = atom<boolean>({
//   key: AppStateKeys.isDarkMode,
//   default: false,
//   effects: [darkModeStorageEffect(AppStateKeys.isDarkMode)],
// });
const darkModeDefault = window.matchMedia('(prefers-color-scheme: dark)').matches;
export const isDarkModeAtom = atomWithStorage<boolean>(AppStateKeys.isDarkMode, darkModeDefault);

// export const userCartAtom = atom<UserCart>({
//   key: AppStateKeys.userCart,
//   default: [],
//   effects: [localStorageEffect<UserCart>(AppStateKeys.userCart, [])],
// });
export const userCartAtom = atomWithStorage<UserCart>(AppStateKeys.userCart, []);

// export const userSearchQueriesAtom = atom<UserSearchQueries>({
//   key: AppStateKeys.userSearchQuery,
//   default: [],
//   effects: [localStorageEffect<UserSearchQueries>(AppStateKeys.userSearchQuery, [])],
// });
export const userSearchQueriesAtom = atomWithStorage<UserSearchQueries>(
  AppStateKeys.userSearchQuery,
  []
);

// export const activeSearchQueryAtom = atom<ActiveSearchQuery>({
//   key: AppStateKeys.activeSearchQuery,
//   default: projectBaseQuery({}),
// });
export const activeSearchQueryAtom = atom<ActiveSearchQuery>(projectBaseQuery({}));

// export const supportModalVisibleAtom = atom<boolean>({
//   key: AppStateKeys.supportModalVisible,
//   default: false,
// });
export const supportModalVisibleAtom = atom<boolean>(false);

// export const savedSearchQueryAtom = atom<ActiveSearchQuery | null>({
//   key: AppStateKeys.savedSeachQuery,
//   default: null,
// });
export const savedSearchQueryAtom = atom<ActiveSearchQuery | null>(null);

// export const availableFacetsAtom = atom<ParsedFacets | Record<string, unknown>>({
//   key: AppStateKeys.availableFacets,
//   default: {},
// });
export const availableFacetsAtom = atom<ParsedFacets | Record<string, unknown>>({});

// export const nodeStatusAtom = atom<NodeStatusArray>({
//   key: AppStateKeys.nodeStatus,
//   default: [],
// });
export const nodeStatusAtom = atom<NodeStatusArray>([]);

// export const cartDownloadIsLoadingAtom = atom<boolean>({
//   key: CartStateKeys.cartDownloadIsLoading,
//   default: false,
//   effects: [localStorageEffect<boolean>(CartStateKeys.cartDownloadIsLoading, false)],
// });
export const cartDownloadIsLoadingAtom = atomWithStorage<boolean>(
  CartStateKeys.cartDownloadIsLoading,
  false
);

// export const cartItemSelectionsAtom = atom<RawSearchResults>({
//   key: CartStateKeys.cartItemSelections,
//   default: [],
//   effects: [localStorageEffect<RawSearchResults>(CartStateKeys.cartItemSelections, [])],
// });
export const cartItemSelectionsAtom = atomWithStorage<RawSearchResults>(
  CartStateKeys.cartItemSelections,
  []
);

// export const globusTaskItemsAtom = atom<GlobusTaskItem[]>({
//   key: GlobusStateKeys.globusTaskItems,
//   default: [],
//   effects: [localStorageEffect<GlobusTaskItem[]>(GlobusStateKeys.globusTaskItems, [])],
// });
export const globusTaskItemsAtom = atomWithStorage<GlobusTaskItem[]>(
  GlobusStateKeys.globusTaskItems,
  []
);

// export const globusSavedEndpointsAtoms = atom<GlobusEndpoint[]>({
//   key: GlobusStateKeys.savedGlobusEndpoints,
//   default: [
//     {
//       canonical_name: '',
//       contact_email: '',
//       display_name: 'Select Globus Collection',
//       entity_type: '',
//       id: '',
//       owner_id: '',
//       owner_string: '',
//       path: '',
//       subscription_id: '',
//     },
//   ],
//   effects: [localStorageEffect<GlobusEndpoint[]>(GlobusStateKeys.savedGlobusEndpoints, [])],
// });
export const globusSavedEndpointsAtoms = atomWithStorage<GlobusEndpoint[]>(
  GlobusStateKeys.savedGlobusEndpoints,
  [
    {
      canonical_name: '',
      contact_email: '',
      display_name: 'Select Globus Collection',
      entity_type: '',
      id: '',
      owner_id: '',
      owner_string: '',
      path: '',
      subscription_id: '',
    },
  ]
);
