// Type definition for a project, based on the MetaGrid Project API
type Project = {
  pk: string;
  name: string;
  facetsByGroup: { [key: string]: string[] };
  facetsUrl: string;
  fullName: string;
};
