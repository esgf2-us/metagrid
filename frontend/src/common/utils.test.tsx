import { render } from '@testing-library/react';
import React from 'react';
import { MessageInstance } from 'antd/es/message/interface';
import { message } from 'antd';
import { rawProjectFixture } from '../api/mock/fixtures';
import { UserSearchQueries, UserSearchQuery } from '../components/Cart/types';
import {
  ActiveSearchQuery,
  RawSearchResult,
  RawSearchResults,
} from '../components/Search/types';
import {
  combineCarts,
  formatBytes,
  getSearchFromUrl,
  getUrlFromSearch,
  objectHasKey,
  objectIsEmpty,
  shallowCompareObjects,
  showError,
  showNotice,
  splitStringByChar,
  unsavedLocalSearches,
} from './utils';

describe('Test objectIsEmpty', () => {
  it('returns true with empty object', () => {
    expect(objectIsEmpty({})).toBeTruthy();
  });

  it('returns false with non-empty object', () => {
    const testObj = { key1: 1, key2: 2 };
    expect(objectIsEmpty(testObj)).toBeFalsy();
  });
});

describe('Test objectHasKey', () => {
  it('returns true if key is found', () => {
    const testObj = { findKey: 'yup' };

    expect(objectHasKey(testObj, 'findKey')).toBeTruthy();
  });

  it('returns false if key is not found ', () => {
    const testObj = {};
    expect(objectHasKey(testObj, 'findKey')).toBeFalsy();
  });
});

describe('Test splitStringByChar', () => {
  let url: string;
  beforeEach(() => {
    url = 'first.com|second.com';
  });
  it('returns split string if no index specified', () => {
    expect(splitStringByChar(url, '|') as string).toEqual([
      'first.com',
      'second.com',
    ]);
  });
  it('returns first half of the split', () => {
    expect(splitStringByChar(url, '|', '0') as string).toEqual('first.com');
  });
  it('returns second half of the split', () => {
    expect(splitStringByChar(url, '|', '1') as string).toEqual('second.com');
  });
  it('throws error if index does not exist', () => {
    expect(() => splitStringByChar(url, '|', '2') as string).toThrow();
  });
});
describe('Test formatBytes', () => {
  it('returns the correct rounded format', () => {
    expect(formatBytes(0)).toEqual('0 Bytes');
    expect(formatBytes(1, -1)).toEqual('1 Bytes');
    expect(formatBytes(1024, 2)).toEqual('1 KB');
    expect(formatBytes(10294828, 3)).toEqual('9.818 MB');
    expect(formatBytes(2 ** 30, 0)).toEqual('1 GB');
    expect(formatBytes(2 ** 40)).toEqual('1 TB');
    expect(formatBytes(2 ** 50)).toEqual('1 PB');
  });
});

describe('Test shallowCompareObjects', () => {
  it('returns true when two objects are the same', () => {
    const obj = { foo: 'bar' };
    expect(shallowCompareObjects(obj, obj)).toBeTruthy();
  });
  it('returns false when two objects are not the same', () => {
    const obj = { foo: 'bar' };
    expect(shallowCompareObjects(obj, {})).toBeFalsy();
  });
});

describe('Test getUrlFromSearch', () => {
  it('returns basic url when active search is empty', () => {
    expect(getUrlFromSearch({} as ActiveSearchQuery)).toBeTruthy();
  });
  it('returns basic url if active search is default object', () => {
    expect(
      getUrlFromSearch({
        project: { name: 'CMIP6' },
        versionType: 'latest',
        resultType: 'all',
        minVersionDate: null,
        maxVersionDate: null,
        filenameVars: [],
        activeFacets: {},
        textInputs: [],
      } as ActiveSearchQuery).includes('?project=CMIP6')
    ).toBeTruthy();
  });
  it('returns basic url with min and max version date', () => {
    expect(
      getUrlFromSearch({
        project: { name: 'CMIP6' },
        versionType: 'latest',
        resultType: 'all',
        minVersionDate: '20210309',
        maxVersionDate: '20210413',
        filenameVars: [],
        activeFacets: {},
        textInputs: [],
      } as ActiveSearchQuery).includes(
        '?project=CMIP6&minVersionDate=20210309&maxVersionDate=20210413'
      )
    ).toBeTruthy();
  });
  it('returns url with filname variables, active facets and text inputs.', () => {
    expect(
      getUrlFromSearch({
        project: { name: 'CMIP6' },
        versionType: 'latest',
        resultType: 'all',
        minVersionDate: '',
        maxVersionDate: '',
        filenameVars: ['clt', 'tsc'],
        activeFacets: {
          activity_id: ['CDRMIP', 'CFMIP'],
          source_id: ['ACCESS-ESM1-5'],
        },
        textInputs: ['CSIRO'],
      } as ActiveSearchQuery).includes(
        '?project=CMIP6&filenameVars=%5B%22clt%22%2C%22tsc%22%5D&activeFacets=%7B%22activity_id%22%3A%5B%22CDRMIP%22%2C%22CFMIP%22%5D%2C%22source_id%22%3A%22ACCESS-ESM1-5%22%7D&textInputs=%5B%22CSIRO%22%5D'
      )
    ).toBeTruthy();
  });
  it('returns basic url with project parameter when search contains project', () => {
    expect(
      getUrlFromSearch({
        project: { name: 'CMIP6' },
      } as ActiveSearchQuery).includes('?project=CMIP6')
    ).toBeTruthy();
  });
});

describe('Test getSearchFromUrl', () => {
  it('returns basic search object if no search params are in url', () => {
    expect(getSearchFromUrl()).toBeTruthy();
  });
  it('returns search object of specific project', () => {
    expect(getSearchFromUrl('?project=CMIP5')).toBeTruthy();
  });
  it('returns search object of specific version type', () => {
    expect(getSearchFromUrl('?project=CMIP6&versionType=all')).toBeTruthy();
  });
  it('returns search object of specific result type', () => {
    expect(
      getSearchFromUrl('?project=CMIP6&resultType=originals+only')
    ).toBeTruthy();
  });
  it('returns search object of version date range', () => {
    expect(
      getSearchFromUrl(
        '?project=CMIP6&minVersionDate=20210401&maxVersionDate=20220401'
      )
    ).toBeTruthy();
  });
  it('returns search object containing active facets, filenames and text input', () => {
    expect(
      getSearchFromUrl(
        '?project=CMIP6&filenameVars=%5B%22clt%22%2C%22tsc%22%5D&activeFacets=%7B%22activity_id%22%3A%5B%22CDRMIP%22%2C%22CFMIP%22%5D%2C%22source_id%22%3A%22ACCESS-ESM1-5%22%7D&textInputs=%5B%22CSIRO%22%5D'
      )
    ).toBeTruthy();
  });
  it('returns default search if no project was found.', () => {
    expect(getSearchFromUrl('BadProjectName/')).toBeTruthy();
  });
  it('returns search object using alternate url with no active facets', () => {
    expect(getSearchFromUrl('input4mips/')).toBeTruthy();
  });
  it('returns search object using alternate url', () => {
    expect(
      getSearchFromUrl(
        'input4mips/?mip_era=CMIP6&activity_id=input4MIPs&institution_id=PCMDI&target_mip=CMIP&source_id=PCMDI-AMIP-1-1-2'
      )
    ).toBeTruthy();
  });
});

describe('Test getUrlFromSearch', () => {
  it('returns basic url when active search is empty', () => {
    expect(getUrlFromSearch({} as ActiveSearchQuery)).toBeTruthy();
  });
  it('returns basic url if active search is default object', () => {
    expect(
      getUrlFromSearch({
        project: { name: 'CMIP6' },
        versionType: 'latest',
        resultType: 'all',
        minVersionDate: null,
        maxVersionDate: null,
        filenameVars: [],
        activeFacets: {},
        textInputs: [],
      } as ActiveSearchQuery).includes('?project=CMIP6')
    ).toBeTruthy();
  });
  it('returns basic url with min and max version date', () => {
    expect(
      getUrlFromSearch({
        project: { name: 'CMIP6' },
        versionType: 'latest',
        resultType: 'all',
        minVersionDate: '20210309',
        maxVersionDate: '20210413',
        filenameVars: [],
        activeFacets: {},
        textInputs: [],
      } as ActiveSearchQuery).includes(
        '?project=CMIP6&minVersionDate=20210309&maxVersionDate=20210413'
      )
    ).toBeTruthy();
  });
  it('returns url with filname variables, active facets and text inputs.', () => {
    expect(
      getUrlFromSearch({
        project: { name: 'CMIP6' },
        versionType: 'latest',
        resultType: 'all',
        minVersionDate: '',
        maxVersionDate: '',
        filenameVars: ['clt', 'tsc'],
        activeFacets: {
          activity_id: ['CDRMIP', 'CFMIP'],
          source_id: ['ACCESS-ESM1-5'],
        },
        textInputs: ['CSIRO'],
      } as ActiveSearchQuery).includes(
        '?project=CMIP6&filenameVars=%5B%22clt%22%2C%22tsc%22%5D&activeFacets=%7B%22activity_id%22%3A%5B%22CDRMIP%22%2C%22CFMIP%22%5D%2C%22source_id%22%3A%22ACCESS-ESM1-5%22%7D&textInputs=%5B%22CSIRO%22%5D'
      )
    ).toBeTruthy();
  });
  it('returns basic url with project parameter when search contains project', () => {
    expect(
      getUrlFromSearch({
        project: { name: 'CMIP6' },
      } as ActiveSearchQuery).includes('?project=CMIP6')
    ).toBeTruthy();
  });
});

describe('Test combineCarts', () => {
  const firstResult: RawSearchResult = {
    key: undefined,
    id: 'firstResult',
    url: ['test1'],
    access: [],
  };
  const secondResult: RawSearchResult = {
    key: undefined,
    id: 'secondResult',
    url: ['test2'],
    access: [],
  };
  const thirdResult: RawSearchResult = {
    key: undefined,
    id: 'thirdResult',
    url: ['test3'],
    access: [],
  };
  const emptySearchResults: RawSearchResults = [];
  const searchResults1: RawSearchResults = [firstResult, secondResult];
  const searchResults2: RawSearchResults = [secondResult, thirdResult];

  it('returns empty results when combining empty results', () => {
    expect(combineCarts(emptySearchResults, emptySearchResults)).toEqual([]);
  });
  it('returns results without duplicates', () => {
    expect(combineCarts(searchResults1, searchResults1)).toEqual(
      searchResults1
    );
  });
  it('returns combined results of 3 items (one duplicate removed)', () => {
    expect(combineCarts(searchResults1, searchResults2).length).toEqual(3);
  });
});

describe('Test unsavedLocal searches', () => {
  const firstResult: UserSearchQuery = {
    uuid: 'uuid1',
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
  const secondResult: UserSearchQuery = {
    uuid: 'uuid2',
    user: 'user',
    project: rawProjectFixture(),
    projectId: '2',
    versionType: 'latest',
    resultType: 'all',
    minVersionDate: '20200101',
    maxVersionDate: '20201231',
    filenameVars: ['var'],
    activeFacets: { foo: ['option1', 'option2'], baz: ['option1'] },
    textInputs: ['foo'],
    url: 'url.com',
  };
  const thirdResult: UserSearchQuery = {
    uuid: 'uuid3',
    user: 'user',
    project: rawProjectFixture(),
    projectId: '3',
    versionType: 'latest',
    resultType: 'all',
    minVersionDate: '20200101',
    maxVersionDate: '20201231',
    filenameVars: ['var'],
    activeFacets: { foo: ['option1', 'option2'], baz: ['option1'] },
    textInputs: ['foo'],
    url: 'url.com',
  };

  const localResults: UserSearchQueries = [firstResult, secondResult];
  const databaseResults: UserSearchQueries = [secondResult, thirdResult];

  it('returns the first result because it is not currently in database', () => {
    expect(unsavedLocalSearches(databaseResults, localResults)).toEqual([
      firstResult,
    ]);
  });
});

describe('Test show notices function', () => {
  // Creating a test component to render the messages and verify they're rendered
  type Props = { testFunc: (msgApi: MessageInstance) => void };
  const TestComponent: React.FC<React.PropsWithChildren<Props>> = ({
    testFunc,
  }) => {
    const [messageApi, contextHolder] = message.useMessage();

    React.useEffect(() => {
      testFunc(messageApi);
    }, []);
    return <div>{contextHolder}</div>;
  };

  it('Shows a success message', async () => {
    const notice = (msgApi: MessageInstance): void => {
      showNotice(msgApi, 'Test notification successful', {
        duration: 5,
        type: 'success',
      });
    };

    const { findByText } = render(<TestComponent testFunc={notice} />);
    expect(await findByText('Test notification successful')).toBeTruthy();
  });

  it('Shows a warning message', async () => {
    const notice = (msgApi: MessageInstance): void => {
      showNotice(msgApi, 'Test warning notification', {
        duration: 5,
        type: 'warning',
      });
    };

    const { findByText } = render(<TestComponent testFunc={notice} />);
    expect(await findByText('Test warning notification')).toBeTruthy();
  });

  it('Shows a error message', async () => {
    const notice = (msgApi: MessageInstance): void => {
      showNotice(msgApi, 'Test error notification', {
        duration: 5,
        type: 'error',
      });
    };

    const { findByText } = render(<TestComponent testFunc={notice} />);
    expect(await findByText('Test error notification')).toBeTruthy();
  });

  it('Shows an info message', async () => {
    const notice = (msgApi: MessageInstance): void => {
      showNotice(msgApi, 'Test info notification', {
        duration: 5,
        type: 'info',
      });
    };

    const { findByText } = render(<TestComponent testFunc={notice} />);
    expect(await findByText('Test info notification')).toBeTruthy();
  });

  it('Shows a default message', async () => {
    const notice = (msgApi: MessageInstance): void => {
      showNotice(msgApi, 'Test default notification');
    };

    const { findByText } = render(<TestComponent testFunc={notice} />);
    expect(await findByText('Test default notification')).toBeTruthy();
  });

  it('Shows a error notification', async () => {
    const notice = (msgApi: MessageInstance): void => {
      showError(msgApi, '');
    };

    const { findByText } = render(<TestComponent testFunc={notice} />);
    expect(await findByText('An unknown error has occurred.')).toBeTruthy();
  });
});
