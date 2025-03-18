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
  rightsList: { [key: string]: string }[];
  license: string;
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
  activeFacets: ActiveFacets;
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
  retracted?: boolean;
  [key: string]: boolean | string | string[] | number | undefined;
};

export type FeatureAssetSTAC = {
  description: string;
  name: string;
  href: string;
  type: string;
  title?: string;
  [key: string]: boolean | string | string[] | number | undefined;
};

export type FeaturePropertiesSTAC = {
  access: string[];
  citation_url: string;
  further_info_url: string;
  version: string;
  [key: string]: boolean | string | string[] | number | undefined;
};

export type FeatureAssets = {
  [key: string]: FeatureAssetSTAC;
};

export type RawSTACSearchResult = {
  id: string;
  assets: FeatureAssets;
  properties: FeaturePropertiesSTAC;
  collection: string[];
  links: { [key: string]: boolean | string | string[] | number | undefined };
  [key: string]: unknown;
};

export type RawSearchResults = (RawSearchResult | RawSTACSearchResult)[];

export type Pagination = {
  page: number;
  pageSize: number;
};
