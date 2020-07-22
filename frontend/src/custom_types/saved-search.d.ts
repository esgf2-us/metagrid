type SavedSearch = {
  uuid: string;
  user: string | null;
  project: Project;
  projectId: string;
  defaultFacets: DefaultFacets;
  activeFacets: ActiveFacets | Record<string, unknown>;
  textInputs: TextInputs | [];
  url: string;
};
