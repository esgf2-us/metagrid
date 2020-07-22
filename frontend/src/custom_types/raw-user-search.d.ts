type RawUserSearch = {
  uuid: string;
  user: string;
  project: {
    pk: int;
    name: string;
    full_name: string;
  };
  project_id: integer;
  default_facets: DefaultFacets;
  active_facets: ActiveFacets;
  text_inputs: TextInputs;
};
