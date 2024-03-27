/* eslint-disable @typescript-eslint/no-unsafe-call */
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
  ParsedFacets,
  RawFacets,
  RawProject,
  RawProjects,
} from '../../components/Facets/types';
import {
  GlobusEndpointData,
  GlobusTokenResponse,
} from '../../components/Globus/types';
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
import { RawUserAuth, RawUserInfo } from '../../contexts/types';

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
    facetsUrl: 'offset=0&limit=0',
    projectUrl: 'https://esgf-dev1.llnl.gov/metagrid/search',
    fullName: 'test1',
  };
  return { ...defaults, ...props } as RawProject;
};

export const projectsFixture = (): RawProjects => [
  rawProjectFixture(),
  rawProjectFixture({ name: 'test2', fullName: 'test2' }),
  rawProjectFixture({ name: 'test3', fullName: 'test3' }),
];

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
    master_id: 'foo',
    url: ['foo.bar|HTTPServer', 'http://test.com/file.nc|OPENDAP'],
    number_of_files: 3,
    data_node: 'aims3.llnl.gov',
    version: 1,
    size: 1,
    access: ['wget', 'HTTPServer', 'OPENDAP', 'Globus'],
    citation_url: ['https://foo.bar'],
    xlink: ['url.com|PID|pid'],
  };
  return { ...defaults, ...props };
};

export const rawSearchResultsFixture = (): Array<RawSearchResult> => [
  rawSearchResultFixture(),
  rawSearchResultFixture({
    id: 'bar',
    title: 'bar',
    master_id: 'bar',
    number_of_files: 2,
    data_node: 'esgf1.dkrz.de',
    access: ['wget', 'HTTPServer', 'OPENDAP'],
  }),
  rawSearchResultFixture({
    id: 'foobar',
    title: 'foobar',
    master_id: 'foobar',
    number_of_files: 3,
    data_node: 'esgf1.test.de',
    access: ['wget', 'HTTPServer', 'OPENDAP'],
  }),
];

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
      ['very_long_facet_text_name_which_wont_fit', 2],
    ],
    optional: [['none', 8]],
  };
  return { ...defaults, ...props } as ParsedFacets;
};

export const userCartFixture = (): UserCart => rawSearchResultsFixture();

export const rawCitationFixture = (
  props: Partial<RawCitation> = {}
): RawCitation => {
  const defaults: RawCitation = {
    identifier: { id: 'an_id', identifierType: 'DOI' },
    creators: [{ creatorName: 'Bob' }, { creatorName: 'Tom' }],
    identifierDOI: '',
    creatorsList: '',
    license:
      'Creative Commons Attribution-ShareAlike 4.0 International License (CC BY-SA 4.0)',
    titles: 'title',
    publisher: 'publisher',
    publicationYear: 2020,
    rightsList: [
      {
        rightsURI: 'http://creativecommons.org/licenses/by-sa/4.0/',
        rights:
          'Creative Commons Attribution-ShareAlike 4.0 International License (CC BY-SA 4.0)',
      },
    ],
  };

  return { ...defaults, ...props };
};

export const activeSearchQueryFixture = (
  props: Partial<ActiveSearchQuery> = {}
): ActiveSearchQuery => {
  const defaults: ActiveSearchQuery = {
    project: rawProjectFixture(),
    versionType: 'latest',
    resultType: 'all',
    minVersionDate: '20200101',
    maxVersionDate: '20201231',
    filenameVars: ['var'],
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
    versionType: 'latest',
    resultType: 'all',
    minVersionDate: '20200101',
    maxVersionDate: '20201231',
    filenameVars: ['var'],
    activeFacets: { foo: ['option1', 'option2'], baz: ['option1'] },
    textInputs: ['foo'],
    url: 'url.com',
  };

  return { ...defaults, ...props } as UserSearchQuery;
};

export const userSearchQueriesFixture = (): UserSearchQueries => [
  userSearchQueryFixture(),
];

type ESGFSearchAPIResponse = {
  response: { numFound: number; docs: RawSearchResults };
  facet_counts: { facet_fields: RawFacets };
};

export const ESGFSearchAPIFixture = (): ESGFSearchAPIResponse => ({
  response: {
    numFound: rawSearchResultsFixture().length,
    docs: rawSearchResultsFixture(),
  },
  facet_counts: {
    facet_fields: rawFacetsFixture(),
  },
});

export const userAuthFixture = (
  props: Partial<RawUserAuth> = {}
): RawUserAuth => {
  const defaults: RawUserAuth = {
    access_token: 'access_token',
    email: 'email',
    is_authenticated: false,
    pk: 'pk',
    refresh_token: 'refresh_token',
  };
  return { ...defaults, ...props };
};

export const globusTransferResponseFixture = (): {
  status: string;
  taskid: string;
} => {
  return { status: 'OK', taskid: '1234567' };
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
    items: [],
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
export const parsedNodeStatusFixture = (): NodeStatusArray => [
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

export const globusRefeshTokenFixture = 'validRefreshToken';
export const globusTransferTokenFixture: GlobusTokenResponse = {
  access_token: '',
  refresh_expires_in: 0,
  refresh_token: 'validTransferToken',
  scope: '',
  token_type: '',
  id_token: '',
  resource_server: 'transfer.api.globus.org',
  other_tokens: [],
  created_on: 0,
  expires_in: 0,
  error: '',
};

export const globusTokenResponseFixture = (): GlobusTokenResponse => {
  return {
    access_token: '',
    refresh_expires_in: 0,
    refresh_token: globusRefeshTokenFixture,
    scope: '',
    token_type: '',
    id_token: '',
    resource_server: '',
    other_tokens: [globusTransferTokenFixture],
    created_on: 0,
    expires_in: 0,
    error: '',
  };
};

export const globusEnabledDatasetFixture = (): RawSearchResult[] => {
  return [
    {
      id: 'foo',
      title: 'foo',
      url: ['foo.bar|HTTPServer', 'http://test.com/file.nc|OPENDAP'],
      number_of_files: 3,
      data_node: 'aims3.llnl.gov',
      version: 1,
      size: 1,
      access: ['HTTPServer', 'OPENDAP', 'Globus'],
      citation_url: ['https://foo.bar'],
      xlink: ['url.com|PID|pid'],
    },
  ];
};

export const globusEndpointFixture = (): GlobusEndpointData => {
  return {
    endpoint: 'globus endpoint',
    label: 'Globus Test Endpoint',
    path: 'test/path',
    globfs: 'test/data',
    endpointId: '1234567',
  };
};
