import { atom, selector } from 'recoil';
import { RawProject } from '../components/Facets/types';
import { ActiveSearchQuery } from '../components/Search/types';
import { emptySearchQuery } from './utils';

// Default search query
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

// The currently active search query, used to obtain search results
export const activeSearchQueryState = atom({
  key: 'ActiveSearchQuery',
  default: emptySearchQuery,
});

// This selector takes the active search query and provides only the active search project
export const activeSearchProjectState = selector({
  key: 'ActiveSearchProject',
  get: ({ get }) => {
    const activeQuery = get(activeSearchQueryState);
    return activeQuery.project;
  },
});
