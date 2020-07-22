// Type definition for a project, based on the MetaGrid Project API
type Project = {
  pk: string;
  name: string;
  facetsUrl: string;
  fullName: string;
  [key: string]: string | string[] | number;
};
