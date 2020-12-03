import { ActiveFacets, RawProject } from '../Facets/types';
import {
  RawSearchResults,
  ResultType,
  TextInputs,
  VersionDate,
} from '../Search/types';

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
  result_type: ResultType;
  min_version_date: VersionDate;
  max_version_date: VersionDate;
  filename_vars: TextInputs | [];
  active_facets: ActiveFacets;
  text_inputs: TextInputs;
};

// camelCase version of the raw API results
export type UserSearchQuery = {
  uuid: string;
  user: VersionDate;
  project: RawProject;
  projectId: string;
  resultType: ResultType;
  minVersionDate: VersionDate;
  maxVersionDate: VersionDate;
  filenameVars: TextInputs | [];
  activeFacets: ActiveFacets | Record<string, unknown>;
  textInputs: TextInputs | [];
  url: string;
};

export type UserSearchQueries = Array<UserSearchQuery>;
