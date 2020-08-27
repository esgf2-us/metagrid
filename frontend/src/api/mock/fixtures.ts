/**
 * This file contains fixtures to pre-populate server-handlers with dummy data.
 * Fixtures allows tests to be maintainable (especially in the case of updated
 * APIs) and reduce duplicate hard-coded dummy data.
 */

/**
 * Project fixture
 */
export const projectFixture = (props: Partial<Project> = {}): Project => {
  const defaults: Project = {
    pk: '1',
    name: 'test1',
    facetsByGroup: { group1: ['facet1'], group2: ['facet2'] },
    facetsUrl: 'https://esgf-node.llnl.gov/esg-search/search/?offset=0&limit=0',
    fullName: 'test1',
  };
  return { ...defaults, ...props } as Project;
};

export const projectsFixture = (): Project[] => {
  return [projectFixture(), projectFixture({ name: 'test2' })];
};

/**
 * Search result fixture based on the ESG Search API.
 * In the API, this value is stored in an array of objects under the 'docs' key
 * of the HTTP  response object.
 */
export const searchResultFixture = (
  props: Partial<RawSearchResult> = {}
): RawSearchResult => {
  const defaults: RawSearchResult = {
    id: 'foo',
    title: 'foo',
    url: ['foo.bar|HTTPServer'],
    number_of_files: 3,
    data_node: 'node.gov',
    version: 1,
    size: 1,
    access: ['HTTPServer', 'OPeNDAP', 'Globus'],
    citation_url: ['https://foo.bar'],
  };
  return { ...defaults, ...props };
};

export const searchResultsFixture = (): RawSearchResult[] => {
  return [
    searchResultFixture(),
    searchResultFixture({
      id: 'bar',
      title: 'bar',
      number_of_files: 2,
      access: ['HTTPServer', 'OPeNDAP'],
    }),
  ];
};

/**
 * Raw facets fixture
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
  return searchResultsFixture();
};

/**
 * Citation fixture based on the Citation API.
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
    uuid: 'uuid',
    user: 'user',
    project: projectFixture(),
    projectId: '1',
    defaultFacets: { latest: true, replica: false },
    activeFacets: { foo: ['option1', 'option2'], baz: ['option1'] },
    textInputs: ['foo'],
    url: 'url.com',
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
 * ESGF Search API fixture.
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

/**
 * User auth fixture based on the Keycloak User Auth API.
 */
export const userAuthFixture = (
  props: Partial<RawUserAuth> = {}
): RawUserAuth => {
  const defaults: RawUserAuth = {
    access_token: 'access_token',
    refresh_token: 'refresh_token',
  };
  return { ...defaults, ...props };
};

/**
 * User info fixture based on the User API.
 */
export const userInfoFixture = (
  props: Partial<RawUserInfo> = {}
): RawUserInfo => {
  const defaults: RawUserInfo = {
    pk: 'pk',
  };
  return { ...defaults, ...props } as RawUserInfo;
};

/**
 * User cart fixture based on the Cart Datasets API.
 */
export const userCartFixture = (
  props: Partial<RawUserCart> = {}
): RawUserCart => {
  const defaults: RawUserCart = {
    items: [searchResultFixture()],
  };
  return { ...defaults, ...props } as RawUserCart;
};
