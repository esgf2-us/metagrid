export type TitledFacet = {
  title: string;
  facet: string;
};
export type StacProjectFacet = string | TitledFacet;
export type FacetsByGroup = { [key: string]: StacProjectFacet[] };
export type RawProject = {
  pk: string;
  name: string;
  projectUrl: string;
  facetsByGroup: FacetsByGroup;
  facetsUrl: string;
  fullName: string;
  isSTAC: boolean;
  projectName?: string;
  stacApiUrl?: string;
};
export type RawProjects = Array<RawProject>;

export type RawFacets = Record<string, (string | number)[]>;
export type ParsedFacets = Record<string, [string, number][]>;
export type ActiveFacets = Record<string, string[]>;
