import { ActiveFacets, RawProject } from '../Facets/types';

export type TextInputs = string[];

export type RawCitation = {
  identifier: { id: string; identifierType: string };
  creators: { [key: string]: string }[];
  titles: string;
  publisher: string;
  publicationYear: number;
  identifierDOI: string;
  creatorsList: string;
};

export type VersionType = 'all' | 'latest';
export type ResultType = 'all' | 'originals only' | 'replicas only';
export type VersionDate = string | null;

export type ActiveSearchQuery = {
  project: RawProject | Record<string, unknown>;
  versionType: VersionType;
  resultType: ResultType;
  minVersionDate: VersionDate;
  maxVersionDate: VersionDate;
  filenameVars: TextInputs | [];
  activeFacets: ActiveFacets | Record<string, unknown>;
  textInputs: TextInputs | [];
};

export type RawSearchResult = {
  id: string;
  url: string[];
  access: string[];
  xlink?: string[] | [];
  citation_url?: string[] | [];
  further_info_url?: string[] | [];
  number_of_files?: number;
  size?: number;
  [key: string]: string | string[] | number | undefined;
};

export type RawSearchResults = Array<RawSearchResult>;

export type Pagination = {
  page: number;
  pageSize: number;
};
