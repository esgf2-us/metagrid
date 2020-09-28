import { ActiveFacets, DefaultFacets, RawProject } from '../Facets/types';
import { RawSearchResults, TextInputs } from '../Search/types';

export type UserCart = RawSearchResults;
export type RawUserCart = {
  items: RawSearchResults;
};

export type RawUserSearchQuery = {
  uuid: string;
  user: string;
  project: {
    pk: number;
    name: string;
    full_name: string;
  };
  project_id: number;
  default_facets: DefaultFacets;
  active_facets: ActiveFacets;
  text_inputs: TextInputs;
};

// camelCase version of the raw API results
export type UserSearchQuery = {
  uuid: string;
  user: string | null;
  project: RawProject;
  projectId: string;
  defaultFacets: DefaultFacets;
  activeFacets: ActiveFacets | Record<string, unknown>;
  textInputs: TextInputs | [];
  url: string;
};

export type UserSearchQueries = Array<UserSearchQuery>;
