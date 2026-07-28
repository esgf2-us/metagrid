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
  project_id?: number;
  project_name?: string;
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
  projectId?: string;
  projectName?: string;
  versionType: VersionType;
  resultType: ResultType;
  minVersionDate: VersionDate;
  maxVersionDate: VersionDate;
  globusOnly: boolean;
  filenameVars: TextInputs | [];
  activeFacets: ActiveFacets;
  textInputs: TextInputs | [];
  url: string;
  resultsCount: number | null;
  searchTime: number | null;
};

export type UserSearchQueries = Array<UserSearchQuery>;

export type ChangeType = 'new' | 'updated';

export type DatasetChange = {
  field: string;
  oldValue: string | number;
  newValue: string | number;
};

export type ChangedDataset = {
  id: string;
  changeType: ChangeType;
  datasetName: string;
  version?: string | number;
  previousVersion?: string | number;
  size?: number;
  numberOfFiles?: number;
  lastModified?: string;
  changes?: DatasetChange[];
};
