import { atom, AtomEffect } from 'recoil';
import { UserCart, UserSearchQueries } from '../../Cart/types';
import { localStorageEffect } from '../../../common/utils';
import { ActiveSearchQuery } from '../../Search/types';
import { ParsedFacets, RawProject } from '../../Facets/types';

enum AppStateKeys {
  isDarkMode = 'isDarkMode',
  userCart = 'userCart',
  userSearchQuery = 'userSearchQuery',
  activeSearchQuery = 'activeSearchQuery',
  supportModalVisible = 'supportModalVisible',
  savedSeachQuery = 'savedSeachQuery',
  availableFacets = 'availableFacets',
}

const darkModeStorageEffect = (key: string): AtomEffect<boolean> => ({ setSelf, onSet }) => {
  const savedValue = localStorage.getItem(key);
  if (savedValue != null) {
    setSelf(savedValue === 'true');
  } else {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setSelf(mediaQuery.matches);
  }

  onSet((newValue) => {
    localStorage.setItem(key, newValue.toString());
  });
};

export const projectBaseQuery = (
  project: Record<string, unknown> | RawProject
): ActiveSearchQuery => ({
  project,
  versionType: 'latest',
  resultType: 'all',
  minVersionDate: null,
  maxVersionDate: null,
  filenameVars: [],
  activeFacets: {},
  textInputs: [],
});

export const isDarkModeAtom = atom<boolean>({
  key: AppStateKeys.isDarkMode,
  default: false,
  effects: [darkModeStorageEffect(AppStateKeys.isDarkMode)],
});

export const userCartAtom = atom<UserCart>({
  key: AppStateKeys.userCart,
  default: [],
  effects: [localStorageEffect<UserCart>(AppStateKeys.userCart, [])],
});

export const userSearchQueriesAtom = atom<UserSearchQueries>({
  key: AppStateKeys.userSearchQuery,
  default: [],
  effects: [localStorageEffect<UserSearchQueries>(AppStateKeys.userSearchQuery, [])],
});

export const activeSearchQueryAtom = atom<ActiveSearchQuery>({
  key: AppStateKeys.activeSearchQuery,
  default: projectBaseQuery({}),
});

export const supportModalVisibleAtom = atom<boolean>({
  key: AppStateKeys.supportModalVisible,
  default: false,
});

export const savedSearchQueryAtom = atom<ActiveSearchQuery | null>({
  key: AppStateKeys.savedSeachQuery,
  default: null,
});

export const availableFacetsAtom = atom<ParsedFacets | Record<string, unknown>>({
  key: AppStateKeys.availableFacets,
  default: {},
});

export default AppStateKeys;
