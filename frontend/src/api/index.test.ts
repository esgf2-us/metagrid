import {
  addUserSearchQuery,
  deleteUserSearchQuery,
  fetchDatasetCitation,
  fetchDatasetFiles,
  FetchDatasetFilesProps,
  fetchNodeStatus,
  fetchProjects,
  fetchSearchResults,
  fetchUserCart,
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
  userSearchQueriesFixture,
  userSearchQueryFixture,
} from './mock/fixtures';
import { rest, server } from './mock/setup-env';
import apiRoutes from './routes';

// Reset all mocks after each test
afterEach(() => {
  jest.clearAllMocks();
});

describe('test fetchProjects()', () => {
  it('returns projects', async () => {
    const projects = await fetchProjects();
    expect(projects).toEqual({ results: projectsFixture() });
  });
  it('catches and throws an error', async () => {
    server.use(
      rest.get(apiRoutes.projects, (_req, res, ctx) => {
        return res(ctx.status(404));
      })
    );
    await expect(fetchProjects()).rejects.toThrow('404');
  });
});

describe('test generateURLSearchQuery', () => {
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
      `${apiRoutes.esgfSearch}?offset=0&limit=10&query=foo&baz=option1&foo=option1,option2`
    );
  });
  it('returns formatted url with offset of 200 and limit of 100 on page 3', () => {
    pagination = {
      page: 3,
      pageSize: 100,
    };

    const url = generateSearchURLQuery(activeSearchQuery, pagination);
    expect(url).toEqual(
      `${apiRoutes.esgfSearch}?offset=200&limit=100&query=foo&baz=option1&foo=option1,option2`
    );
  });
  it('returns formatted url without free-text', () => {
    const url = generateSearchURLQuery(
      { ...activeSearchQuery, textInputs: [] },
      pagination
    );
    expect(url).toEqual(
      `${apiRoutes.esgfSearch}?offset=0&limit=10&query=*&baz=option1&foo=option1,option2`
    );
  });
  it('returns formatted url with replica param', () => {
    const url = generateSearchURLQuery(
      { ...activeSearchQuery, resultType: 'originals only' },
      pagination
    );
    expect(url).toEqual(
      `${apiRoutes.esgfSearch}?replica=false&offset=0&limit=10&query=foo&baz=option1&foo=option1,option2`
    );
  });

  it('returns formatted url without facets', () => {
    const url = generateSearchURLQuery(
      { ...activeSearchQuery, activeFacets: {} },
      pagination
    );
    expect(url).toEqual(`${apiRoutes.esgfSearch}?offset=0&limit=10&query=foo&`);
  });
});

describe('test fetchSearchResults()', () => {
  let reqUrl: string;

  beforeEach(() => {
    reqUrl = apiRoutes.esgfSearch;
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
  it('catches and throws an error', async () => {
    server.use(
      rest.get(apiRoutes.esgfSearch, (_req, res, ctx) => {
        return res(ctx.status(404));
      })
    );
    await expect(fetchSearchResults([reqUrl])).rejects.toThrow('404');
  });
});

describe('test processCitation()', () => {
  it('returns citation object with additional correct fields', () => {
    const citation: RawCitation = {
      identifier: { id: 'an_id', identifierType: 'DOI' },
      creators: [{ creatorName: 'Bob' }, { creatorName: 'Tom' }],
      identifierDOI: '',
      creatorsList: '',
      titles: 'title',
      publisher: 'publisher',
      publicationYear: 2020,
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

describe('test fetchCitation()', () => {
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
  it('catches and throws an error', async () => {
    server.use(
      rest.get(apiRoutes.citation, (_req, res, ctx) => {
        return res(ctx.status(404));
      })
    );

    await expect(
      fetchDatasetCitation({
        url: 'citation_url',
      })
    ).rejects.toThrow('404');
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
  it('catches and throws an error', async () => {
    server.use(
      rest.get(apiRoutes.esgfSearch, (_req, res, ctx) => {
        return res(ctx.status(404));
      })
    );
    await expect(fetchDatasetFiles([], props)).rejects.toThrow('404');
  });
});

describe('test fetchUserCart', () => {
  it('returns user"s cart', async () => {
    const files = await fetchUserCart('pk', 'access_token');
    expect(files).toEqual(rawUserCartFixture());
  });
  it('catches and throws an error', async () => {
    server.use(
      rest.get(apiRoutes.userCart, (_req, res, ctx) => {
        return res(ctx.status(404));
      })
    );
    await expect(fetchUserCart('pk', 'access_token')).rejects.toThrow('404');
  });
});

describe('test fetchUserCart', () => {
  it('updates user"s cart and returns user"s cart', async () => {
    const files = await updateUserCart('pk', 'access_token', []);
    expect(files).toEqual(rawUserCartFixture());
  });
  it('catches and throws an error', async () => {
    server.use(
      rest.patch(apiRoutes.userCart, (_req, res, ctx) => {
        return res(ctx.status(404));
      })
    );
    await expect(updateUserCart('pk', 'access_token', [])).rejects.toThrow(
      '404'
    );
  });
});

describe('test fetchUserSearches', () => {
  it('returns user"s searches', async () => {
    const res = await fetchUserSearchQueries('access_token');

    expect(res).toEqual({ results: userSearchQueriesFixture() });
  });
  it('catches and throws an error', async () => {
    server.use(
      rest.get(apiRoutes.userSearches, (_req, res, ctx) => {
        return res(ctx.status(404));
      })
    );

    await expect(fetchUserSearchQueries('access_token')).rejects.toThrow('404');
  });
});

describe('test addUserSearch', () => {
  it('adds user search and returns response', async () => {
    const payload = userSearchQueryFixture();
    const res = await addUserSearchQuery('pk', 'access_token', payload);

    expect(res).toEqual(payload);
  });
  it('catches and throws an error', async () => {
    server.use(
      rest.post(apiRoutes.userSearches, (_req, res, ctx) => {
        return res(ctx.status(404));
      })
    );

    const payload = userSearchQueryFixture();
    await expect(
      addUserSearchQuery('pk', 'access_token', payload)
    ).rejects.toThrow('404');
  });
});

describe('test deleteUserSearch', () => {
  it('deletes user search and returns response', async () => {
    const res = await deleteUserSearchQuery('pk', 'access_token');

    expect(res).toEqual('');
  });
  it('catches and throws an error', async () => {
    server.use(
      rest.delete(apiRoutes.userSearch, (_req, res, ctx) => {
        return res(ctx.status(404));
      })
    );

    await expect(deleteUserSearchQuery('pk', 'access_token')).rejects.toThrow(
      '404'
    );
  });
});

describe('test fetchWgetScript', () => {
  it('returns a response with a single dataset id', async () => {
    await fetchWgetScript('id', ['var']);
  });
  it('returns a response with an array of dataset ids', async () => {
    await fetchWgetScript(['id', 'id']);
  });

  it('catches and throws an error', async () => {
    server.use(
      rest.get(apiRoutes.wget, (_req, res, ctx) => {
        return res(ctx.status(404));
      })
    );

    await expect(fetchWgetScript('id')).rejects.toThrow('404');
  });
});

describe('test openDownloadUrl()', () => {
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

describe('test parseNodeStatus()', () => {
  it('returns correctly formatted node status', () => {
    const nodeStatus = rawNodeStatusFixture();
    expect(parseNodeStatus(nodeStatus)).toEqual(parsedNodeStatusFixture());
  });
});

describe('test fetchNodeStatus()', () => {
  it('returns parsed node status', async () => {
    const res = await fetchNodeStatus();

    expect(res).toEqual(parsedNodeStatusFixture());
  });
  it('catches and throws an error', async () => {
    server.use(
      rest.get(apiRoutes.nodeStatus, (_req, res, ctx) => {
        return res(ctx.status(404));
      })
    );

    await expect(fetchNodeStatus()).rejects.toThrow('404');
  });
});
