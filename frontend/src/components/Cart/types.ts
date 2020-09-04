import { ActiveFacets, DefaultFacets, RawProject } from '../Facets/types';
import { RawSearchResult, TextInputs } from '../Search/types';

export type CartType = RawSearchResult[];
export type RawUserCart = {
  items: RawSearchResult[];
};

export type RawUserSearch = {
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

export type SavedSearch = {
  uuid: string;
  user: string | null;
  project: RawProject;
  projectId: string;
  defaultFacets: DefaultFacets;
  activeFacets: ActiveFacets | Record<string, unknown>;
  textInputs: TextInputs | [];
  url: string;
};
