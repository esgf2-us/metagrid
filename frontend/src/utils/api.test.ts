import {
  fetchCitation,
  fetchFiles,
  fetchResults,
  fetchProjects,
  genUrlQuery,
  processCitation,
} from './api';
import {
  defaultFacetsFixture,
  projectsFixture,
  citationFixture,
  esgSearchApiFixture,
} from '../test/fixtures';
import { server, rest } from '../test/setup-env';
import { apiRoutes } from '../test/server-handlers';

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
      `${apiRoutes.esgSearchDatasets}?limit=10&offset=0&latest=true&replica=false&query=input1,input2&facet1=var1,var2&facet2=var3,var4`
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
      `${apiRoutes.esgSearchDatasets}?limit=100&offset=200&latest=true&replica=false&query=input1,input2&facet1=var1,var2&facet2=var3,var4`
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
      `${apiRoutes.esgSearchDatasets}?limit=10&offset=0&latest=true&replica=false&query=*&facet1=var1,var2&facet2=var3,var4`
    );
  });

  it('returns formatted url without facets', () => {
    const pagination = {
      page: 1,
      pageSize: 10,
    };

    const url = genUrlQuery(baseUrl, defaultFacets, {}, textInputs, pagination);
    expect(url).toEqual(
      `${apiRoutes.esgSearchDatasets}?limit=10&offset=0&latest=true&replica=false&query=input1,input2&`
    );
  });
});

describe('test fetchResults()', () => {
  let reqUrl: string;

  beforeEach(() => {
    reqUrl = apiRoutes.esgSearchDatasets;
  });
  it('calls axios and returns results', async () => {
    reqUrl += '?query=input1,input2&facet1=var1,var2&facet2=var3,var4';

    const projects = await fetchResults([reqUrl]);
    expect(projects).toEqual(esgSearchApiFixture());
  });

  it('calls axios and returns results without free-text', async () => {
    reqUrl += '?query=*&facet1=var1,var2&facet2=var3,var4';

    const projects = await fetchResults({ reqUrl });
    expect(projects).toEqual(esgSearchApiFixture());
  });
  it('catches and throws an error', async () => {
    server.use(
      rest.get(apiRoutes.esgSearchDatasets, (_req, res, ctx) => {
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
  beforeEach(() => {
    server.use(
      // ESGF Citation API
      rest.get(apiRoutes.citation, (_req, res, ctx) => {
        return res(ctx.status(200), ctx.json(citationFixture()));
      })
    );
  });
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
      rest.get(apiRoutes.esgSearchFiles, (_req, res, ctx) => {
        return res(ctx.status(404));
      })
    );
    await expect(fetchFiles({ id: dataset.id })).rejects.toThrow('404');
  });
});
