// This file contains fixtures to seed tests with dummy data.
// Fixtures allows tests to be maintainable (especially in the case of updated
// APIs) and reduce duplicate hard-coded dummy data.

/**
 * Project fixture, related to the Project model from the MetaGrid API
 */
export const projectFixture = (props: Partial<Project> = {}): Project => {
  const defaults: Project = {
    name: 'test1',
    facets_url:
      'https://esgf-node.llnl.gov/esg-search/search/?offset=0&limit=0',
  };
  return { ...defaults, ...props } as Project;
};

export const projectsFixture = (): Project[] => {
  return [projectFixture(), projectFixture({ name: 'test2' })];
};

/**
 * Search result fixture, related to the ESG Search API.
 * In the API, this value is stored in an array of objects under the 'docs' key
 * of the HTTP  response object.
 */
export const searchResultFixture = (
  props: Partial<RawSearchResult> = {}
): RawSearchResult => {
  const defaults: RawSearchResult = {
    id: 'foo',
    title: 'foo',
    url: ['foo.bar'],
    number_of_files: 3,
    data_node: 'node.gov',
    version: 1,
    size: 1,
    access: ['HTTPServer', 'GridFTP', 'OPENDAP', 'Globus'],
    citation_url: ['https://foo.bar'],
  };
  return { ...defaults, ...props };
};

export const searchResultsFixture = (): RawSearchResult[] => {
  return [
    searchResultFixture(),
    searchResultFixture({ id: 'bar', title: 'bar', number_of_files: 2 }),
  ];
};

/**
 * Raw facets fixture, related to the ESG Search API.
 */
export const rawFacetsFixture = (props: Partial<RawFacets> = {}): RawFacets => {
  const defaults: RawFacets = {
    facet1: ['foo', 3, 'bar', 5],
    facet2: ['baz', 2, 'fubar', 3],
  };
  return { ...defaults, ...props } as RawFacets;
};

/**
 * Parsed facets fixture, which is the raw facets parsed using a helper function.
 */
export const parsedFacetsFixture = (
  props: Partial<ParsedFacets> = {}
): ParsedFacets => {
  const defaults: ParsedFacets = {
    facet1: [
      ['foo', 3],
      ['bar', 5],
    ],
    facet2: [
      ['baz', 2],
      ['fubar', 3],
    ],
  };
  return { ...defaults, ...props } as ParsedFacets;
};

/**
 * Cart fixture, which contains multiple search results.
 */
export const cartFixture = (): Cart => {
  return [searchResultFixture(), searchResultFixture()];
};

/**
 * Citation fixture, related to the Citation API.
 */
export const citationFixture = (
  props: Partial<RawCitation> = {}
): RawCitation => {
  const defaults: RawCitation = {
    identifier: { id: 'an_id', identifierType: 'DOI' },
    creators: [{ creatorName: 'Bob' }, { creatorName: 'Tom' }],
    identifierDOI: '',
    creatorsList: '',
    titles: 'title',
    publisher: 'publisher',
    publicationYear: 2020,
  };

  return { ...defaults, ...props };
};

/**
 * Saved search fixture.
 */
export const savedSearchFixture = (
  props: Partial<SavedSearch> = {}
): SavedSearch => {
  const defaults: SavedSearch = {
    id: 'id',
    project: {
      name: 'foo',
      facets_url:
        'latest=true&replica=false&query=foo&baz=option1&foo=option1,option2',
    },
    defaultFacets: { latest: true, replica: false },
    activeFacets: { foo: ['option1', 'option2'], baz: ['option1'] },
    textInputs: ['foo'],
    numResults: 1,
  };

  return { ...defaults, ...props } as SavedSearch;
};

export const savedSearchesFixture = (): SavedSearch[] => {
  return [savedSearchFixture()];
};

export const defaultFacetsFixture = (
  props: Partial<DefaultFacets> = {}
): DefaultFacets => {
  const defaults: DefaultFacets = { latest: true, replica: false };
  return { ...defaults, ...props } as DefaultFacets;
};

/**
 * ESG Search API fixture
 */
export const esgSearchApiFixture = (): ESGSearchApiResponse => {
  return {
    response: {
      numFound: searchResultsFixture().length,
      docs: searchResultsFixture(),
    },
    facet_counts: {
      facet_fields: rawFacetsFixture(),
    },
  };
};
