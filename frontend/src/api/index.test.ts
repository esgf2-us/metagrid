import {
  addUserSearch,
  deleteUserSearch,
  fetchCitation,
  fetchFiles,
  fetchProjects,
  fetchResults,
  fetchUserCart,
  fetchUserSearches,
  fetchWgetScript,
  genUrlQuery,
  openDownloadURL,
  processCitation,
  updateUserCart,
} from '.';
import {
  citationFixture,
  defaultFacetsFixture,
  esgSearchApiFixture,
  projectsFixture,
  savedSearchesFixture,
  savedSearchFixture,
  userCartFixture,
} from './mock/fixtures';
import { rest, server } from './mock/setup-env';
import apiRoutes from './routes';

// Reset all mocks after each test
afterEach(() => {
  jest.clearAllMocks();
});

describe('test fetchProjects()', () => {
  it('calls axios and returns projects', async () => {
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

describe('test genUrlQuery()', () => {
  let baseUrl: string;
  let defaultFacets: DefaultFacets;
  let activeFacets: ActiveFacets;
  let textInputs: TextInputs;
  beforeEach(() => {
    baseUrl = `limit=0&offset=0`;
    defaultFacets = defaultFacetsFixture();
    activeFacets = {
      facet1: ['var1', 'var2'],
      facet2: ['var3', 'var4'],
    };
    textInputs = ['input1', 'input2'];
  });

  it('returns formatted url with offset of 0 on page 1', () => {
    const pagination = {
      page: 1,
      pageSize: 10,
    };

    const url = genUrlQuery(
      baseUrl,
      defaultFacets,
      activeFacets,
      textInputs,
      pagination
    );

    expect(url).toEqual(
      `${apiRoutes.esgfDatasets}?limit=10&offset=0&latest=true&replica=false&query=input1,input2&facet1=var1,var2&facet2=var3,var4`
    );
  });
  it('returns formatted url with offset of 200 and limit of 100 on page 3', () => {
    const pagination = {
      page: 3,
      pageSize: 100,
    };

    const url = genUrlQuery(
      baseUrl,
      defaultFacets,
      activeFacets,
      textInputs,
      pagination
    );
    expect(url).toEqual(
      `${apiRoutes.esgfDatasets}?limit=100&offset=200&latest=true&replica=false&query=input1,input2&facet1=var1,var2&facet2=var3,var4`
    );
  });
  it('returns formatted url without free-text', () => {
    const pagination = {
      page: 1,
      pageSize: 10,
    };

    const url = genUrlQuery(
      baseUrl,
      defaultFacets,
      activeFacets,
      [],
      pagination
    );
    expect(url).toEqual(
      `${apiRoutes.esgfDatasets}?limit=10&offset=0&latest=true&replica=false&query=*&facet1=var1,var2&facet2=var3,var4`
    );
  });

  it('returns formatted url without facets', () => {
    const pagination = {
      page: 1,
      pageSize: 10,
    };

    const url = genUrlQuery(baseUrl, defaultFacets, {}, textInputs, pagination);
    expect(url).toEqual(
      `${apiRoutes.esgfDatasets}?limit=10&offset=0&latest=true&replica=false&query=input1,input2&`
    );
  });
});

describe('test fetchResults()', () => {
  let reqUrl: string;

  beforeEach(() => {
    reqUrl = apiRoutes.esgfDatasets;
  });
  it('returns results', async () => {
    reqUrl += '?query=input1,input2&facet1=var1,var2&facet2=var3,var4';

    const projects = await fetchResults([reqUrl]);
    expect(projects).toEqual(esgSearchApiFixture());
  });

  it('returns results without free-text', async () => {
    reqUrl += '?query=*&facet1=var1,var2&facet2=var3,var4';

    const projects = await fetchResults({ reqUrl });
    expect(projects).toEqual(esgSearchApiFixture());
  });
  it('catches and throws an error', async () => {
    server.use(
      rest.get(apiRoutes.esgfDatasets, (_req, res, ctx) => {
        return res(ctx.status(404));
      })
    );
    await expect(fetchResults([reqUrl])).rejects.toThrow('404');
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
    const citation = citationFixture();
    const results = {
      ...citation,
      identifierDOI: 'http://doi.org/an_id',
      creatorsList: 'Bob; Tom',
    };

    const newCitation = await fetchCitation({
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
      fetchCitation({
        url: 'citation_url',
      })
    ).rejects.toThrow('404');
  });
});

describe('test fetchFiles()', () => {
  let dataset: { [key: string]: string };
  beforeEach(() => {
    dataset = { id: 'testid' };
  });

  it('calls axios and returns files', async () => {
    const files = await fetchFiles({ id: dataset.id });
    expect(files).toEqual(esgSearchApiFixture());
  });
  it('catches and throws an error', async () => {
    server.use(
      rest.get(apiRoutes.esgfFiles, (_req, res, ctx) => {
        return res(ctx.status(404));
      })
    );
    await expect(fetchFiles({ id: dataset.id })).rejects.toThrow('404');
  });
});

describe('test fetchUserCart', () => {
  it('returns user"s cart', async () => {
    const files = await fetchUserCart('pk', 'access_token');
    expect(files).toEqual(userCartFixture());
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
    expect(files).toEqual(userCartFixture());
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
    const res = await fetchUserSearches('access_token');

    expect(res).toEqual({ results: savedSearchesFixture() });
  });
  it('catches and throws an error', async () => {
    server.use(
      rest.get(apiRoutes.userSearches, (_req, res, ctx) => {
        return res(ctx.status(404));
      })
    );

    await expect(fetchUserSearches('access_token')).rejects.toThrow('404');
  });
});

describe('test addUserSearch', () => {
  it('adds user search and returns response', async () => {
    const payload = savedSearchFixture();
    const res = await addUserSearch('pk', 'access_token', payload);

    expect(res).toEqual(payload);
  });
  it('catches and throws an error', async () => {
    server.use(
      rest.post(apiRoutes.userSearches, (_req, res, ctx) => {
        return res(ctx.status(404));
      })
    );

    const payload = savedSearchFixture();
    await expect(addUserSearch('pk', 'access_token', payload)).rejects.toThrow(
      '404'
    );
  });
});

describe('test deleteUserSearch', () => {
  it('deletes user search and returns response', async () => {
    const res = await deleteUserSearch('pk', 'access_token');

    expect(res).toEqual('');
  });
  it('catches and throws an error', async () => {
    server.use(
      rest.delete(apiRoutes.userSearch, (_req, res, ctx) => {
        return res(ctx.status(404));
      })
    );

    await expect(deleteUserSearch('pk', 'access_token')).rejects.toThrow('404');
  });
});

describe('test fetchWgetScript', () => {
  it('returns a response with a single dataset id', async () => {
    await fetchWgetScript('id');
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
