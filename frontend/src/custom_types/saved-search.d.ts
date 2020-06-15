type SavedSearch = {
  id: string;
  project: Project;
  defaultFacets: DefaultFacets;
  activeFacets: ActiveFacets | Record<string, unknown>;
  textInputs: TextInputs | [];
  numResults: number;
};
