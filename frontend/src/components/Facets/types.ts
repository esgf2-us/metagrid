export type RawProject = {
  pk: string;
  name: string;
  projectUrl: string;
  facetsByGroup: { [key: string]: string[] };
  facetsUrl: string;
  fullName: string;
  isSTAC: boolean;
};
export type RawProjects = Array<RawProject>;

export type RawFacets = Record<string, (string | number)[]>;
export type ParsedFacets = Record<string, [string, number][]>;
export type ActiveFacets = Record<string, string[]>;
