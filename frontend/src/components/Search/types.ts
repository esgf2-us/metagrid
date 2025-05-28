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

export type SearchResults = { [key: string]: unknown };

export type StacLink = {
  rel: string;
  type: string;
  href: string;
};

export type StacAsset = {
  id: string;
  access: string[];
  description: string;
  alternatename: string;
  name: string;
  roles: string[];
  href: string;
  type: string;
  title?: string;
  [key: string]: boolean | string | string[] | number | undefined;
};

export type StacProperties = {
  access: string[];
  citation_url: string;
  further_info_url: string;
  version: string;
  [key: string]: boolean | string | string[] | number | undefined;
};

export type StacFeature = {
  id: string;
  bbox: number[];
  geometry: { type: string; coordinates: number[][][] };
  links: StacLink[];
  type: string;
  assets: { [name: string]: StacAsset };
  properties: StacProperties;
  collection: string[];
  stac_version: string;
  [key: string]: unknown;
};

export type StacSearchResponse = {
  features: StacFeature[];
  links: StacLink[];
  numMatched: number;
  numReturned: number;
  type: string;
  [key: string]: unknown;
};

export type StacFacetsData = {
  [key: string]: string[];
};

export type StacResponse = {
  facets: StacFacetsData;
  search: StacSearchResponse;
  stac: boolean;
};

export type RawSearchResult = {
  id: string;
  master_id?: string;
  url?: string[];
  access: string[];
  xlink?: string[] | [];
  citation_url?: string[] | [];
  further_info_url?: string[] | [];
  number_of_files?: number;
  size?: number;
  retracted?: boolean;
  properties?: StacProperties;
  links?: StacLink[];
  globus_link?: string;
  assets?: { [name: string]: StacAsset };
  version?: string | number;
  [key: string]: unknown;
};

export type RawSearchResults = Array<RawSearchResult>;

export type Pagination = {
  page: number;
  pageSize: number;
};
