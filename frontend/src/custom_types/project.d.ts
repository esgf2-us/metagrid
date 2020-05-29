// Type definition for a project, based on the MetaGrid Project API
type Project = {
  name: string;
  facets_url: string;
  [key: string]: string | string[] | number;
};
