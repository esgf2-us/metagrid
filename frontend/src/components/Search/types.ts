import { TableProps } from 'antd';
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

export type RawSearchResults = Array<RawSearchResult>;

export type Pagination = {
  page: number;
  pageSize: number;
};

export type OnChange = NonNullable<TableProps<RawSearchResult>['onChange']>;

type GetSingle<T> = T extends (infer U)[] ? U : never;
export type Sorts = GetSingle<Parameters<OnChange>[2]>;

export type AlignType = 'left' | 'center' | 'right';
export type FixedType = 'left' | 'right' | boolean;
