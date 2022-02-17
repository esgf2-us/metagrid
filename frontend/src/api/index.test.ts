import {
  addUserSearchQuery,
  deleteUserSearchQuery,
  fetchDatasetCitation,
  fetchDatasetFiles,
  FetchDatasetFilesProps,
  fetchNodeStatus,
  fetchProjects,
  fetchSearchResults,
  fetchUserAuth,
  fetchUserCart,
  fetchUserInfo,
  fetchUserSearchQueries,
  fetchWgetScript,
  generateSearchURLQuery,
  openDownloadURL,
  parseNodeStatus,
  processCitation,
  updateUserCart,
} from '.';
import {
  ActiveSearchQuery,
  Pagination,
  RawCitation,
} from '../components/Search/types';
import {
  activeSearchQueryFixture,
  ESGFSearchAPIFixture,
  parsedNodeStatusFixture,
  projectsFixture,
  rawCitationFixture,
  rawNodeStatusFixture,
  rawUserCartFixture,
  userAuthFixture,
  userInfoFixture,
  userSearchQueriesFixture,
  userSearchQueryFixture,
} from './mock/fixtures';
import { rest, server } from './mock/setup-env';
import apiRoutes from './routes';

const genericNetworkErrorMsg = 'Failed to Connect';

// Reset all mocks after each test
afterEach(() => {
  jest.clearAllMocks();
});

describe('test fetching user authentication', () => {
  it('returns user authentication tokens', async () => {
    const userAuth = await fetchUserAuth(['keycloak_token']);
    expect(userAuth).toEqual(userAuthFixture());
  });
  it('catches and throws error based on HTTP status code', async () => {
    server.use(
      rest.post(apiRoutes.keycloakAuth.path, (_req, res, ctx) =>
        res(ctx.status(404))
      )
    );
    await expect(fetchUserAuth(['keycloak_token'])).rejects.toThrow(
      apiRoutes.keycloakAuth.handleErrorMsg(404)
    );
  });
  it('catches and throws generic network error', async () => {
    server.use(
      rest.post(apiRoutes.keycloakAuth.path, (_req, res) =>
        res.networkError(genericNetworkErrorMsg)
      )
    );
    await expect(fetchUserAuth(['keycloak_token'])).rejects.toThrow(
      apiRoutes.keycloakAuth.handleErrorMsg('generic')
    );
  });
});

describe('test fetching user info', () => {
  it('returns user info', async () => {
    const userInfo = await fetchUserInfo(['access_token']);
    expect(userInfo).toEqual(userInfoFixture());
  });

  it('returns error', async () => {
    server.use(
      rest.get(apiRoutes.userInfo.path, (_req, res, ctx) =>
        res(ctx.status(404))
      )
    );
    await expect(fetchUserInfo(['access_token'])).rejects.toThrow(
      apiRoutes.userInfo.handleErrorMsg(404)
    );
  });
  it('catches and throws generic network error', async () => {
    server.use(
      rest.get(apiRoutes.userInfo.path, (_req, res) =>
        res.networkError(genericNetworkErrorMsg)
      )
    );
    await expect(fetchUserInfo(['access_token'])).rejects.toThrow(
      apiRoutes.userInfo.handleErrorMsg('generic')
    );
  });
});

describe('test fetching projects', () => {
  it('returns projects', async () => {
    const projects = await fetchProjects();
    expect(projects).toEqual({ results: projectsFixture() });
  });
  it('catches and throws an error based on HTTP status code', async () => {
    server.use(
      rest.get(apiRoutes.projects.path, (_req, res, ctx) =>
        res(ctx.status(404))
      )
    );
    await expect(fetchProjects()).rejects.toThrow(
      apiRoutes.projects.handleErrorMsg(404)
    );
  });

  it('catches and throws generic network error', async () => {
    server.use(
      rest.get(apiRoutes.projects.path, (_req, res) =>
        res.networkError(genericNetworkErrorMsg)
      )
    );
    await expect(fetchProjects()).rejects.toThrow(
      apiRoutes.projects.handleErrorMsg('generic')
    );
  });
});

describe('test generating search url query', () => {
  let activeSearchQuery: ActiveSearchQuery;
  let pagination: Pagination;
  beforeEach(() => {
    activeSearchQuery = activeSearchQueryFixture();
    pagination = {
      page: 1,
      pageSize: 10,
    };
  });

  it('returns formatted url with offset of 0 on page 1', () => {
    const url = generateSearchURLQuery(activeSearchQuery, pagination);
    expect(url).toEqual(
      `${apiRoutes.esgfSearch.path}?offset=0&limit=10&latest=true&min_version=20200101&max_version=20201231&query=foo&baz=option1&foo=option1,option2`
    );
  });
  it('returns formatted url with offset of 200 and limit of 100 on page 3', () => {
    pagination = {
      page: 3,
      pageSize: 100,
    };

    const url = generateSearchURLQuery(activeSearchQuery, pagination);
    expect(url).toEqual(
      `${apiRoutes.esgfSearch.path}?offset=200&limit=100&latest=true&min_version=20200101&max_version=20201231&query=foo&baz=option1&foo=option1,option2`
    );
  });
  it('returns formatted url without free-text', () => {
    const url = generateSearchURLQuery(
      { ...activeSearchQuery, textInputs: [] },
      pagination
    );
    expect(url).toEqual(
      `${apiRoutes.esgfSearch.path}?offset=0&limit=10&latest=true&min_version=20200101&max_version=20201231&query=*&baz=option1&foo=option1,option2`
    );
  });
  it('returns formatted url with replica param', () => {
    const url = generateSearchURLQuery(
      { ...activeSearchQuery, resultType: 'originals only' },
      pagination
    );
    expect(url).toEqual(
      `${apiRoutes.esgfSearch.path}?offset=0&limit=10&latest=true&replica=false&min_version=20200101&max_version=20201231&query=foo&baz=option1&foo=option1,option2`
    );
  });

  it('returns formatted url without facets', () => {
    const url = generateSearchURLQuery(
      { ...activeSearchQuery, activeFacets: {} },
      pagination
    );
    expect(url).toEqual(
      `${apiRoutes.esgfSearch.path}?offset=0&limit=10&latest=true&min_version=20200101&max_version=20201231&query=foo&`
    );
  });

  it('returns formatted url without version type', () => {
    const url = generateSearchURLQuery(
      { ...activeSearchQuery, versionType: 'all' },
      pagination
    );
    expect(url).toEqual(
      `${apiRoutes.esgfSearch.path}?offset=0&limit=10&min_version=20200101&max_version=20201231&query=foo&baz=option1&foo=option1,option2`
    );
  });
});

describe('test fetching search results', () => {
  let reqUrl: string;

  beforeEach(() => {
    reqUrl = apiRoutes.esgfSearch.path;
  });
  it('returns results', async () => {
    reqUrl += '?query=input1,input2&data_node=var1,var2&facet2=var3,var4';

    const projects = await fetchSearchResults([reqUrl]);
    expect(projects).toEqual(ESGFSearchAPIFixture());
  });

  it('returns results without free-text', async () => {
    reqUrl += '?query=*&data_node=var1,var2&facet2=var3,var4';

    const projects = await fetchSearchResults({ reqUrl });
    expect(projects).toEqual(ESGFSearchAPIFixture());
  });
  it('catches and throws an error based on HTTP status code', async () => {
    server.use(
      rest.get(apiRoutes.esgfSearch.path, (_req, res, ctx) =>
        res(ctx.status(404))
      )
    );
    await expect(fetchSearchResults([reqUrl])).rejects.toThrow(
      apiRoutes.esgfSearch.handleErrorMsg(404)
    );
  });

  it('catches and throws generic network error', async () => {
    server.use(
      rest.get(apiRoutes.esgfSearch.path, (_req, res) =>
        res.networkError(genericNetworkErrorMsg)
      )
    );
    await expect(fetchSearchResults([reqUrl])).rejects.toThrow(
      apiRoutes.esgfSearch.handleErrorMsg('generic')
    );
  });
});

describe('test processing citation', () => {
  it('returns citation object with additional correct fields', () => {
    const citation: RawCitation = {
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
    const result: RawCitation = {
      ...citation,
      identifierDOI: 'http://doi.org/an_id',
      creatorsList: 'Bob; Tom',
    };

    const newCitation = processCitation(citation);
    expect(newCitation).toMatchObject(result);
  });
});

describe('test fetching citation', () => {
  it('returns results', async () => {
    const citation = rawCitationFixture();
    const results = {
      ...citation,
      identifierDOI: 'http://doi.org/an_id',
      creatorsList: 'Bob; Tom',
    };

    const newCitation = await fetchDatasetCitation({
      url: 'citation_url',
    });
    expect(newCitation).toEqual(results);
  });
  it('catches and throws an error based on HTTP status code', async () => {
    server.use(
      rest.get(apiRoutes.citation.path, (_req, res, ctx) =>
        res(ctx.status(404))
      )
    );

    await expect(
      fetchDatasetCitation({
        url: 'citation_url',
      })
    ).rejects.toThrow(apiRoutes.citation.handleErrorMsg(404));
  });
  it('catches and throws generic network error', async () => {
    server.use(
      rest.get(apiRoutes.citation.path, (_req, res) =>
        res.networkError(genericNetworkErrorMsg)
      )
    );
    await expect(fetchDatasetCitation({ url: 'citation_url' })).rejects.toThrow(
      apiRoutes.citation.handleErrorMsg('generic')
    );
  });
});

describe('test fetchFiles()', () => {
  let props: FetchDatasetFilesProps;
  beforeEach(() => {
    props = {
      id: 'testid|node.org',
      paginationOptions: { page: 1, pageSize: 10 },
      filenameVars: ['var'],
    };
  });

  it('returns files', async () => {
    const files = await fetchDatasetFiles([], props);
    expect(files).toEqual(ESGFSearchAPIFixture());
  });
  it('catches and throws an error based on HTTP status code', async () => {
    server.use(
      rest.get(apiRoutes.esgfSearch.path, (_req, res, ctx) =>
        res(ctx.status(404))
      )
    );
    await expect(fetchDatasetFiles([], props)).rejects.toThrow(
      apiRoutes.esgfSearch.handleErrorMsg(404)
    );
  });

  it('catches and throws generic network error', async () => {
    server.use(
      rest.get(apiRoutes.esgfSearch.path, (_req, res) =>
        res.networkError(genericNetworkErrorMsg)
      )
    );
    await expect(fetchDatasetFiles([], props)).rejects.toThrow(
      apiRoutes.esgfSearch.handleErrorMsg('generic')
    );
  });
});

describe('test fetching user cart', () => {
  it('returns user"s cart', async () => {
    const files = await fetchUserCart('pk', 'access_token');
    expect(files).toEqual(rawUserCartFixture());
  });
  it('catches and throws an error based on HTTP status code', async () => {
    server.use(
      rest.get(apiRoutes.userCart.path, (_req, res, ctx) =>
        res(ctx.status(404))
      )
    );
    await expect(fetchUserCart('pk', 'access_token')).rejects.toThrow(
      apiRoutes.userCart.handleErrorMsg(404)
    );
  });
  it('catches and throws generic network error', async () => {
    server.use(
      rest.get(apiRoutes.userCart.path, (_req, res) =>
        res.networkError(genericNetworkErrorMsg)
      )
    );
    await expect(fetchUserCart('pk', 'access_token')).rejects.toThrow(
      apiRoutes.userCart.handleErrorMsg('generic')
    );
  });
});

describe('test updating user cart', () => {
  it('updates user"s cart and returns user"s cart', async () => {
    const files = await updateUserCart('pk', 'access_token', []);
    expect(files).toEqual(rawUserCartFixture());
  });
  it('catches and throws an error based on HTTP status code', async () => {
    server.use(
      rest.patch(apiRoutes.userCart.path, (_req, res, ctx) =>
        res(ctx.status(404))
      )
    );
    await expect(updateUserCart('pk', 'access_token', [])).rejects.toThrow(
      apiRoutes.userCart.handleErrorMsg(404)
    );
  });
  it('catches and throws generic network error', async () => {
    server.use(
      rest.patch(apiRoutes.userCart.path, (_req, res) =>
        res.networkError(genericNetworkErrorMsg)
      )
    );
    await expect(updateUserCart('pk', 'access_token', [])).rejects.toThrow(
      apiRoutes.userCart.handleErrorMsg('generic')
    );
  });
});

describe('test fetching user searches', () => {
  it('returns user"s searches', async () => {
    const res = await fetchUserSearchQueries('access_token');

    expect(res).toEqual({ results: userSearchQueriesFixture() });
  });
  it('catches and throws an error based on HTTP status code', async () => {
    server.use(
      rest.get(apiRoutes.userSearches.path, (_req, res, ctx) =>
        res(ctx.status(404))
      )
    );

    await expect(fetchUserSearchQueries('access_token')).rejects.toThrow(
      apiRoutes.userSearches.handleErrorMsg(404)
    );
  });
  it('catches and throws generic network error', async () => {
    server.use(
      rest.get(apiRoutes.userSearches.path, (_req, res) =>
        res.networkError(genericNetworkErrorMsg)
      )
    );
    await expect(fetchUserSearchQueries('access_token')).rejects.toThrow(
      apiRoutes.userSearches.handleErrorMsg('generic')
    );
  });
});

describe('test adding user search', () => {
  it('adds user search and returns response', async () => {
    const payload = userSearchQueryFixture();
    const res = await addUserSearchQuery('pk', 'access_token', payload);

    expect(res).toEqual(payload);
  });
  it('catches and throws an error based on HTTP status code', async () => {
    server.use(
      rest.post(apiRoutes.userSearches.path, (_req, res, ctx) =>
        res(ctx.status(404))
      )
    );

    const payload = userSearchQueryFixture();
    await expect(
      addUserSearchQuery('pk', 'access_token', payload)
    ).rejects.toThrow(apiRoutes.userSearches.handleErrorMsg(404));
  });

  it('catches and throws generic network error', async () => {
    server.use(
      rest.post(apiRoutes.userSearches.path, (_req, res) =>
        res.networkError(genericNetworkErrorMsg)
      )
    );

    const payload = userSearchQueryFixture();
    await expect(
      addUserSearchQuery('pk', 'access_token', payload)
    ).rejects.toThrow(apiRoutes.userSearches.handleErrorMsg('generic'));
  });
});

describe('test deleting user search', () => {
  it('deletes user search and returns response', async () => {
    const res = await deleteUserSearchQuery('pk', 'access_token');

    expect(res).toEqual('');
  });
  it('catches and throws an error based on HTTP status code', async () => {
    server.use(
      rest.delete(apiRoutes.userSearch.path, (_req, res, ctx) =>
        res(ctx.status(404))
      )
    );

    await expect(deleteUserSearchQuery('pk', 'access_token')).rejects.toThrow(
      apiRoutes.userSearch.handleErrorMsg(404)
    );
  });
  it('catches and throws generic network error', async () => {
    server.use(
      rest.delete(apiRoutes.userSearch.path, (_req, res) =>
        res.networkError(genericNetworkErrorMsg)
      )
    );

    await expect(deleteUserSearchQuery('pk', 'access_token')).rejects.toThrow(
      apiRoutes.userSearch.handleErrorMsg('generic')
    );
  });
});

describe('test fetching wget script', () => {
  it('returns a response with a single dataset id', async () => {
    await fetchWgetScript('id', ['var']);
  });
  it('returns a response with an array of dataset ids', async () => {
    await fetchWgetScript(['id', 'id']);
  });

  it('catches and throws an error based on HTTP status code', async () => {
    server.use(
      rest.get(apiRoutes.wget.path, (_req, res, ctx) => res(ctx.status(404)))
    );

    await expect(fetchWgetScript('id')).rejects.toThrow(
      apiRoutes.wget.handleErrorMsg(404)
    );
  });
  it('catches and throws generic network error', async () => {
    server.use(
      rest.get(apiRoutes.wget.path, (_req, res) =>
        res.networkError(genericNetworkErrorMsg)
      )
    );
    await expect(fetchWgetScript('id')).rejects.toThrow(
      apiRoutes.wget.handleErrorMsg('generic')
    );
  });
});

describe('test opening download url', () => {
  let windowSpy: jest.SpyInstance;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockedOpen: jest.Mock<any, any>;

  beforeEach(() => {
    mockedOpen = jest.fn();
    windowSpy = jest.spyOn(global, 'window', 'get');
  });

  afterEach(() => {
    windowSpy.mockRestore();
  });

  it('should return https://example.com', () => {
    const url = 'https://example.com';
    windowSpy.mockImplementation(() => ({
      location: {
        origin: url,
      },
      open: mockedOpen,
    }));

    openDownloadURL(url);
    expect(window.location.origin).toEqual('https://example.com');
  });
});

describe('test parsing node status', () => {
  it('returns correctly formatted node status', () => {
    const nodeStatus = rawNodeStatusFixture();
    expect(parseNodeStatus(nodeStatus)).toEqual(parsedNodeStatusFixture());
  });
});

describe('test fetching node status', () => {
  it('returns parsed node status', async () => {
    const res = await fetchNodeStatus();

    expect(res).toEqual(parsedNodeStatusFixture());
  });
  it('catches and throws an error based on HTTP status code', async () => {
    server.use(
      rest.get(apiRoutes.nodeStatus.path, (_req, res, ctx) =>
        res(ctx.status(404))
      )
    );

    await expect(fetchNodeStatus()).rejects.toThrow(
      apiRoutes.nodeStatus.handleErrorMsg(404)
    );
  });

  it('catches and throws generic network error', async () => {
    server.use(
      rest.get(apiRoutes.nodeStatus.path, (_req, res) =>
        res.networkError(genericNetworkErrorMsg)
      )
    );

    await expect(fetchNodeStatus()).rejects.toThrow(
      apiRoutes.nodeStatus.handleErrorMsg('generic')
    );
  });
});
