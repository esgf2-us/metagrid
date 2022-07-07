import { ActiveFacets, RawProject } from '../Facets/types';
import {
  RawSearchResults,
  ResultType,
  TextInputs,
  VersionDate,
  VersionType,
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
    project_url: string;
  };
  project_id: number;
  version_type: VersionType;
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
  user: string | null;
  project: RawProject;
  projectId: string;
  versionType: VersionType;
  resultType: ResultType;
  minVersionDate: VersionDate;
  maxVersionDate: VersionDate;
  filenameVars: TextInputs | [];
  activeFacets: ActiveFacets | Record<string, unknown>;
  textInputs: TextInputs | [];
  url: string;
};

export type UserSearchQueries = Array<UserSearchQuery>;
