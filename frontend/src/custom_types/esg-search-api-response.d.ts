type ESGSearchApiResponse = {
  response: { numFound: number; docs: RawSearchResult[] };
  facet_counts: { facet_fields: RawFacets };
};
