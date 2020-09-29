/**
 * This file contains fixtures to pre-populate server-handlers with dummy data.
 * Fixtures allows tests to be maintainable (especially in the case of updated
 * APIs) and reduce duplicate hard-coded dummy data.
 */

import {
  RawUserCart,
  UserCart,
  UserSearchQueries,
  UserSearchQuery,
} from '../../components/Cart/types';
import {
  DefaultFacets,
  ParsedFacets,
  RawFacets,
  RawProject,
  RawProjects,
} from '../../components/Facets/types';
import {
  RawCitation,
  RawSearchResult,
  RawSearchResults,
} from '../../components/Search/types';
import { RawUserAuth, RawUserInfo } from '../../contexts/AuthContext';

export const rawProjectFixture = (
  props: Partial<RawProject> = {}
): RawProject => {
  const defaults: RawProject = {
    pk: '1',
    name: 'test1',
    facetsByGroup: { group1: ['facet1'], group2: ['facet2'] },
    facetsUrl: 'https://esgf-node.llnl.gov/esg-search/search/?offset=0&limit=0',
    fullName: 'test1',
  };
  return { ...defaults, ...props } as RawProject;
};

export const projectsFixture = (): RawProjects => {
  return [rawProjectFixture(), rawProjectFixture({ name: 'test2' })];
};

/**
 * Search result fixture based on the ESGF Search API.
 * In the API, this value is stored in an array of objects under the 'docs' key
 * of the HTTP  response object.
 */
export const rawSearchResultFixture = (
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

export const rawSearchResultsFixture = (): Array<RawSearchResult> => {
  return [
    rawSearchResultFixture(),
    rawSearchResultFixture({
      id: 'bar',
      title: 'bar',
      number_of_files: 2,
      access: ['HTTPServer', 'OPeNDAP'],
    }),
  ];
};

export const rawFacetsFixture = (props: Partial<RawFacets> = {}): RawFacets => {
  const defaults: RawFacets = {
    facet1: ['foo', 3, 'bar', 5],
    facet2: ['baz', 2, 'fubar', 3],
  };
  return { ...defaults, ...props } as RawFacets;
};

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

export const userCartFixture = (): UserCart => {
  return rawSearchResultsFixture();
};

export const rawCitationFixture = (
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

export const userSearchQueryFixture = (
  props: Partial<UserSearchQuery> = {}
): UserSearchQuery => {
  const defaults: UserSearchQuery = {
    uuid: 'uuid',
    user: 'user',
    project: rawProjectFixture(),
    projectId: '1',
    defaultFacets: { latest: true, replica: false },
    activeFacets: { foo: ['option1', 'option2'], baz: ['option1'] },
    textInputs: ['foo'],
    url: 'url.com',
  };

  return { ...defaults, ...props } as UserSearchQuery;
};

export const userSearchQueriesFixture = (): UserSearchQueries => {
  return [userSearchQueryFixture()];
};

export const defaultFacetsFixture = (
  props: Partial<DefaultFacets> = {}
): DefaultFacets => {
  const defaults: DefaultFacets = { latest: true, replica: false };
  return { ...defaults, ...props } as DefaultFacets;
};

type ESGFSearchAPIResponse = {
  response: { numFound: number; docs: RawSearchResults };
  facet_counts: { facet_fields: RawFacets };
};

export const ESGFSearchAPIFixture = (): ESGFSearchAPIResponse => {
  return {
    response: {
      numFound: rawSearchResultsFixture().length,
      docs: rawSearchResultsFixture(),
    },
    facet_counts: {
      facet_fields: rawFacetsFixture(),
    },
  };
};

export const userAuthFixture = (
  props: Partial<RawUserAuth> = {}
): RawUserAuth => {
  const defaults: RawUserAuth = {
    access_token: 'access_token',
    refresh_token: 'refresh_token',
  };
  return { ...defaults, ...props };
};

export const userInfoFixture = (
  props: Partial<RawUserInfo> = {}
): RawUserInfo => {
  const defaults: RawUserInfo = {
    pk: 'pk',
  };
  return { ...defaults, ...props } as RawUserInfo;
};

export const rawUserCartFixture = (
  props: Partial<RawUserCart> = {}
): RawUserCart => {
  const defaults: RawUserCart = {
    items: [rawSearchResultFixture()],
  };
  return { ...defaults, ...props } as RawUserCart;
};
