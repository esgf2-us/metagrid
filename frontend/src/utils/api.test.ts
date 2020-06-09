import mockAxios from '../__mocks__/axios';
import {
  fetchCitation,
  fetchFiles,
  fetchResults,
  fetchProjects,
  genUrlQuery,
  nodeProtocol,
  nodeUrl,
  proxyString,
  processCitation,
} from './api';

// Reset all mocks after each test
afterEach(() => {
  jest.clearAllMocks();
});

describe('test fetchProjects()', () => {
  it('calls axios and returns projects', async () => {
    const results = ['test1', 'test2'];
    mockAxios.get.mockImplementationOnce(() =>
      Promise.resolve({
        data: {
          results,
        },
      })
    );
    const projects = await fetchProjects();
    expect(projects).toEqual({ results });
    expect(mockAxios.get).toHaveBeenCalledTimes(1);
    expect(mockAxios.get).toHaveBeenCalledWith('/api/v1/projects/');
  });
  it('catches and throws an error', async () => {
    const errorMessage = 'Network Error';

    mockAxios.get.mockImplementationOnce(() =>
      Promise.reject(new Error(errorMessage))
    );

    await expect(fetchProjects()).rejects.toThrow(errorMessage);
  });
});

describe('test genUrlQuery()', () => {
  let baseUrl: string;
  let textInputs: TextInputs;
  let activeFacets: ActiveFacets;
  beforeEach(() => {
    baseUrl = 'http://someBaseUrl.com/?limit=0&offset=0';
    textInputs = ['input1', 'input2'];
    activeFacets = {
      facet1: ['var1', 'var2'],
      facet2: ['var3', 'var4'],
    };
  });

  it('returns formatted url with offset of 0 on page 1', () => {
    const pagination = {
      page: 1,
      pageSize: 10,
    };

    const url = genUrlQuery(baseUrl, textInputs, activeFacets, pagination);

    expect(url).toEqual(
      'http://someBaseUrl.com/?limit=10&offset=0&query=input1,input2&facet1=var1,var2&facet2=var3,var4'
    );
  });
  it('returns formatted url with offset of 200 and limit of 100 on page 3', () => {
    const pagination = {
      page: 3,
      pageSize: 100,
    };

    const url = genUrlQuery(baseUrl, textInputs, activeFacets, pagination);
    expect(url).toEqual(
      'http://someBaseUrl.com/?limit=100&offset=200&query=input1,input2&facet1=var1,var2&facet2=var3,var4'
    );
  });
  it('returns formatted url without free-text', () => {
    const pagination = {
      page: 1,
      pageSize: 10,
    };

    const url = genUrlQuery(baseUrl, [], activeFacets, pagination);
    expect(url).toEqual(
      'http://someBaseUrl.com/?limit=10&offset=0&query=*&facet1=var1,var2&facet2=var3,var4'
    );
  });

  it('returns formatted url without facets', () => {
    const pagination = {
      page: 1,
      pageSize: 10,
    };

    const url = genUrlQuery(baseUrl, textInputs, [], pagination);
    expect(url).toEqual(
      'http://someBaseUrl.com/?limit=10&offset=0&query=input1,input2&'
    );
  });
});

describe('test fetchResults()', () => {
  let results: string[];
  let reqUrl: string;

  beforeEach(() => {
    results = ['test1', 'test2'];
    reqUrl = 'http://someBaseUrl.com/?';
  });
  it('calls axios and returns results', async () => {
    mockAxios.get.mockImplementationOnce(() =>
      Promise.resolve({
        data: {
          results,
        },
      })
    );
    reqUrl += '&query=input1,input2&facet1=var1,var2&facet2=var3,var4';

    const projects = await fetchResults(reqUrl);
    expect(projects).toEqual({ results });
    expect(mockAxios.get).toHaveBeenCalledTimes(1);
    expect(mockAxios.get).toHaveBeenCalledWith(`${proxyString}/${reqUrl}`);
  });

  it('calls axios and returns results without free-text', async () => {
    mockAxios.get.mockImplementationOnce(() =>
      Promise.resolve({
        data: {
          results,
        },
      })
    );
    reqUrl += '&query=*&facet1=var1,var2&facet2=var3,var4';

    const projects = await fetchResults(reqUrl);
    expect(projects).toEqual({ results });
    expect(mockAxios.get).toHaveBeenCalledTimes(1);
    expect(mockAxios.get).toHaveBeenCalledWith(`${proxyString}/${reqUrl}`);
  });
  it('catches and throws an error', async () => {
    const errorMessage = 'Network Error';

    mockAxios.get.mockImplementationOnce(() =>
      Promise.reject(new Error(errorMessage))
    );

    await expect(fetchResults(reqUrl)).rejects.toThrow(errorMessage);
  });
});

describe('test processCitation()', () => {
  it('returns citation object with additional correct fields', () => {
    const citation: Citation = {
      identifier: { id: 'an_id', identifierType: 'DOI' },
      creators: [{ creatorName: 'Bob' }, { creatorName: 'Tom' }],
      identifierDOI: '',
      creatorsList: '',
      titles: 'title',
      publisher: 'publisher',
      publicationYear: 2020,
    };
    const result: Citation = {
      ...citation,
      identifierDOI: 'http://doi.org/an_id',
      creatorsList: 'Bob; Tom',
    };

    const newCitation = processCitation(citation);
    expect(newCitation).toMatchObject(result);
  });
});

describe('test fetchCitation()', () => {
  it('calls axios and returns results', async () => {
    const citation = {
      identifier: { id: 'an_id', identifierType: 'DOI' },
      creators: [{ creatorName: 'Bob' }, { creatorName: 'Tom' }],
    };
    const results = {
      identifier: { id: 'an_id', identifierType: 'DOI' },
      creators: [{ creatorName: 'Bob' }, { creatorName: 'Tom' }],
      identifierDOI: 'http://doi.org/an_id',
      creatorsList: 'Bob; Tom',
    };
    mockAxios.get.mockImplementationOnce(() =>
      Promise.resolve({
        data: {
          ...citation,
        },
      })
    );

    const newCitation = await fetchCitation({
      url: 'http://someBaseUrl.com/?',
    });
    expect(newCitation).toEqual({ ...results });
    expect(mockAxios.get).toHaveBeenCalledTimes(1);
    expect(mockAxios.get).toHaveBeenCalledWith(
      `${proxyString}/http://someBaseUrl.com/?`
    );
  });
  it('catches and throws an error', async () => {
    const errorMessage = 'Network Error';

    mockAxios.get.mockImplementationOnce(() =>
      Promise.reject(new Error(errorMessage))
    );

    await expect(
      fetchCitation({
        url: 'http://someBaseUrl.com/?',
      })
    ).rejects.toThrow(errorMessage);
  });
});

describe('test fetchFiles()', () => {
  let dataset: { [key: string]: string };
  beforeEach(() => {
    dataset = { id: 'testid' };
  });

  it('calls axios and returns files', async () => {
    const results = ['test1', 'test2'];
    mockAxios.get.mockImplementationOnce(() =>
      Promise.resolve({
        data: {
          results,
        },
      })
    );
    const files = await fetchFiles({ id: dataset.id });
    expect(files).toEqual({ results });
    expect(mockAxios.get).toHaveBeenCalledTimes(1);
    expect(mockAxios.get).toHaveBeenCalledWith(
      `${proxyString}/${nodeProtocol}${nodeUrl}/search_files/${dataset.id}/${nodeUrl}/?limit=10`
    );
  });
  it('catches and throws an error', async () => {
    const errorMessage = 'Network Error';

    mockAxios.get.mockImplementationOnce(() =>
      Promise.reject(new Error(errorMessage))
    );

    await expect(fetchFiles({ id: dataset.id })).rejects.toThrow(errorMessage);
  });
});
