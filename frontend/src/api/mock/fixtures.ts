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
  NodeStatusArray,
  RawNodeStatus,
} from '../../components/NodeStatus/types';
import {
  ActiveSearchQuery,
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
    facetsByGroup: {
      group1: ['data_node'],
      group2: ['facet2'],
      group3: ['optional'],
    },
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
    data_node: 'aims3.llnl.gov',
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
      data_node: 'esgf1.dkrz.de',
      access: ['HTTPServer', 'OPeNDAP'],
    }),
  ];
};

export const rawFacetsFixture = (props: Partial<RawFacets> = {}): RawFacets => {
  const defaults: RawFacets = {
    data_node: ['aims3.llnl.gov', 3, 'esgf1.dkrz.de', 5],
    facet2: ['baz', 2, 'fubar', 3],
    optional: ['none', 8],
  };
  return { ...defaults, ...props } as RawFacets;
};

export const parsedFacetsFixture = (
  props: Partial<ParsedFacets> = {}
): ParsedFacets => {
  const defaults: ParsedFacets = {
    data_node: [
      ['aims3.llnl.gov', 3],
      ['esgf1.dkrz.de', 5],
    ],
    facet2: [
      ['baz', 2],
      ['fubar', 3],
    ],
    optional: [['none', 8]],
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

export const activeSearchQueryFixture = (
  props: Partial<ActiveSearchQuery> = {}
): ActiveSearchQuery => {
  const defaults: ActiveSearchQuery = {
    project: rawProjectFixture(),
    resultType: 'all',
    activeFacets: { foo: ['option1', 'option2'], baz: ['option1'] },
    textInputs: ['foo'],
  };
  return { ...defaults, ...props } as ActiveSearchQuery;
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

export const rawNodeStatusFixture = (
  props: Partial<RawNodeStatus> = {}
): RawNodeStatus => {
  const defaults: RawNodeStatus = {
    status: 'success',
    data: {
      resultType: 'vector',
      result: [
        {
          metric: {
            __name__: 'probe_success',
            instance: 'aims3.llnl.gov',
            job: 'http_2xx',
            target: 'https://aims3.llnl.gov/thredds/catalog/catalog.html',
          },
          value: [1603315430.611, '1'],
        },
        {
          metric: {
            __name__: 'probe_success',
            instance: 'esgf1.dkrz.de',
            job: 'http_2xx',
            target: 'https://esgf1.dkrz.de/thredds/catalog/catalog.html',
          },
          value: [1603315430.611, '0'],
        },
      ],
    },
  };

  return { ...defaults, ...props } as RawNodeStatus;
};
export const parsedNodeStatusFixture = (): NodeStatusArray => {
  return [
    {
      name: 'aims3.llnl.gov',
      source: 'https://aims3.llnl.gov/thredds/catalog/catalog.html',
      timestamp: 'Wed, 21 Oct 2020 21:23:50 GMT',
      isOnline: true,
    },
    {
      name: 'esgf1.dkrz.de',
      source: 'https://esgf1.dkrz.de/thredds/catalog/catalog.html',
      timestamp: 'Wed, 21 Oct 2020 21:23:50 GMT',
      isOnline: false,
    },
  ];
};
