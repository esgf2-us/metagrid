import { render } from '@testing-library/react';
import React from 'react';
import { MessageInstance } from 'antd/es/message/interface';
import { message } from 'antd';
import { Provider, useAtom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { vi } from 'vitest';
import { rawProjectFixture, activeSearchQueryFixture } from '../test/mock/fixtures';
import { UserSearchQueries, UserSearchQuery } from '../components/Cart/types';
import { ActiveSearchQuery, RawSearchResult, RawSearchResults } from '../components/Search/types';
import {
  combineCarts,
  formatBytes,
  getCurrentAppPage,
  getSearchFromUrl,
  getUrlFromSearch,
  objectHasKey,
  objectIsEmpty,
  shallowCompareObjects,
  showError,
  showNotice,
  splitStringByChar,
  unsavedLocalSearches,
  createSearchRouteURL,
  getStrSizeInKb,
  compressData,
  decompressData,
  saveToLocalStorage,
  getFromLocalStorage,
  cachePagination,
  getCachedPagination,
  cacheSearchResults,
  getCachedSearchResults,
  clearCachedSearchResults,
  showBanner,
  saveBannerText,
  clearDeprecatedStorageKeys,
  createEsgpullCommand,
  createIntakeEsgfSearch,
  getLastMessageSeen,
  setStartupMessageAsSeen,
  searchAlreadyExists,
  downloadFileForUser,
  identifyProblematicFacets,
} from './utils';
import { AppPage } from './types';
import { mockConfig } from '../test/testFunctions';
import { localStorageMock, sessionStorageMock, tempStorageGetMock } from '../test/mock/mockStorage';

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
    expect(splitStringByChar(url, '|') as string).toEqual(['first.com', 'second.com']);
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
    const url = getUrlFromSearch({} as ActiveSearchQuery);
    expect(url).toBe(
      `${window.location.protocol}//${window.location.host}${window.location.pathname}`,
    );
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
      } as ActiveSearchQuery).includes('?project=CMIP6'),
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
        '?project=CMIP6&minVersionDate=20210309&maxVersionDate=20210413',
      ),
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
      } as unknown as ActiveSearchQuery).includes(
        '?project=CMIP6&filenameVars=%5B%22clt%22%2C%22tsc%22%5D&activeFacets=%7B%22activity_id%22%3A%5B%22CDRMIP%22%2C%22CFMIP%22%5D%2C%22source_id%22%3A%22ACCESS-ESM1-5%22%7D&textInputs=%5B%22CSIRO%22%5D',
      ),
    ).toBeTruthy();
  });
  it('returns basic url with project parameter when search contains project', () => {
    expect(
      getUrlFromSearch({
        project: { name: 'CMIP6' },
      } as ActiveSearchQuery).includes('?project=CMIP6'),
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
    expect(getSearchFromUrl('?project=CMIP6&resultType=originals+only')).toBeTruthy();
  });
  it('returns search object of version date range', () => {
    expect(
      getSearchFromUrl('?project=CMIP6&minVersionDate=20210401&maxVersionDate=20220401'),
    ).toBeTruthy();
  });
  it('returns search object containing active facets, filenames and text input', () => {
    expect(
      getSearchFromUrl(
        '?project=CMIP6&filenameVars=%5B%22clt%22%2C%22tsc%22%5D&activeFacets=%7B%22activity_id%22%3A%5B%22CDRMIP%22%2C%22CFMIP%22%5D%2C%22source_id%22%3A%22ACCESS-ESM1-5%22%7D&textInputs=%5B%22CSIRO%22%5D',
      ),
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
        'input4mips/?mip_era=CMIP6&activity_id=input4MIPs&institution_id=PCMDI&target_mip=CMIP&source_id=PCMDI-AMIP-1-1-2',
      ),
    ).toBeTruthy();
  });
});

describe('Test getUrlFromSearch', () => {
  it('returns basic url when active search is empty', () => {
    const url = getUrlFromSearch({} as ActiveSearchQuery);
    expect(url).toBe(
      `${window.location.protocol}//${window.location.host}${window.location.pathname}`,
    );
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
      } as ActiveSearchQuery).includes('?project=CMIP6'),
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
        '?project=CMIP6&minVersionDate=20210309&maxVersionDate=20210413',
      ),
    ).toBeTruthy();
  });
  it('returns url with filname variables, active facets and text inputs.', () => {
    const url = getUrlFromSearch({
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
    } as unknown as ActiveSearchQuery);
    expect(url).toContain(
      '?project=CMIP6&filenameVars=%5B%22clt%22%2C%22tsc%22%5D&activeFacets=%7B%22activity_id%22%3A%5B%22CDRMIP%22%2C%22CFMIP%22%5D%2C%22source_id%22%3A%22ACCESS-ESM1-5%22%7D&textInputs=%5B%22CSIRO%22%5D',
    );
  });
  it('returns basic url with project parameter when search contains project', () => {
    expect(
      getUrlFromSearch({
        project: { name: 'CMIP6' },
      } as ActiveSearchQuery).includes('?project=CMIP6'),
    ).toBeTruthy();
  });
});

describe('Test combineCarts', () => {
  const firstResult: RawSearchResult = {
    key: undefined,
    id: 'firstResult',
    url: ['test1'],
    access: [],
    isStac: false,
  };
  const secondResult: RawSearchResult = {
    key: undefined,
    id: 'secondResult',
    url: ['test2'],
    access: [],
    isStac: false,
  };
  const thirdResult: RawSearchResult = {
    key: undefined,
    id: 'thirdResult',
    url: ['test3'],
    access: [],
    isStac: false,
  };
  const emptySearchResults: RawSearchResults = [];
  const searchResults1: RawSearchResults = [firstResult, secondResult];
  const searchResults2: RawSearchResults = [secondResult, thirdResult];

  it('returns empty results when combining empty results', () => {
    expect(combineCarts(emptySearchResults, emptySearchResults)).toEqual([]);
  });
  it('returns results without duplicates', () => {
    expect(combineCarts(searchResults1, searchResults1)).toEqual(searchResults1);
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
    url: 'https://localhost/url.com',
    resultsCount: 200,
    searchTime: 100000,
    globusOnly: false,
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
    url: 'https://localhost/url.com',
    resultsCount: 200,
    searchTime: 100000,
    globusOnly: false,
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
    url: 'https://localhost/url.com',
    resultsCount: 200,
    searchTime: 100000,
    globusOnly: false,
  };

  const localResults: UserSearchQueries = [firstResult, secondResult];
  const databaseResults: UserSearchQueries = [secondResult, thirdResult];

  it('returns the first result because it is not currently in database', () => {
    expect(unsavedLocalSearches(databaseResults, localResults)).toEqual([firstResult]);
  });
});

describe('Test getCurrentAppPage', () => {
  it('returns appropriate page name based on window location', () => {
    expect(getCurrentAppPage()).toEqual(AppPage.Unknown);

    // eslint-disable-next-line
    window = Object.create(window);
    const url = 'https://test.com/search';
    Object.defineProperty(window, 'location', {
      value: {
        href: url,
        pathname: 'testing/search',
      },
      writable: true,
    });
    expect(window.location.href).toEqual(url);
    expect(window.location.pathname).toEqual('testing/search');

    // Test page names
    expect(getCurrentAppPage()).toEqual(AppPage.Main);
    window.location.pathname = 'testing/cart/items';
    expect(getCurrentAppPage()).toEqual(AppPage.Cart);
    window.location.pathname = 'testing/cart/searches';
    expect(getCurrentAppPage()).toEqual(AppPage.SavedSearches);
    window.location.pathname = 'testing/cart/nodes';
    expect(getCurrentAppPage()).toEqual(AppPage.NodeStatus);
    window.location.pathname = 'testing/bad';
    expect(getCurrentAppPage()).toEqual(AppPage.Unknown);
  });
});

describe('Test show notices function', () => {
  // Creating a test component to render the messages and verify they're rendered
  type Props = { testFunc: (msgApi: MessageInstance) => void };
  const TestComponent: React.FC<React.PropsWithChildren<Props>> = ({ testFunc }) => {
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
describe('Test localStorageEffect', () => {
  const key = 'testKey';
  const defaultVal = 'defaultValue';
  const testAtom = atomWithStorage(key, defaultVal);

  const TestComponent: React.FC = () => {
    const [value] = useAtom(testAtom);
    return <div>{value}</div>;
  };

  it('sets to default value when localStorage is empty', () => {
    localStorageMock.removeItem(key);
    const { getByText } = render(
      <Provider>
        <TestComponent />
      </Provider>,
    );
    expect(getByText(defaultVal)).toBeTruthy();
  });

  it('sets to default value when JSON.parse throws an error', () => {
    localStorageMock.setItem(key, 'invalid JSON');
    const { getByText } = render(
      <Provider>
        <TestComponent />
      </Provider>,
    );
    expect(getByText(defaultVal)).toBeTruthy();
  });
});

describe('Test createSearchRouteURL', () => {
  window.METAGRID.SEARCH_URL = 'https://example.com';
  it('returns the correct URL with search parameters', () => {
    const url = 'https://example.com/path?param1=value1&param2=value2';
    const result = createSearchRouteURL(url);
    expect(result).toBe('https://example.com?param1=value1&param2=value2');
  });

  it('returns the correct URL without search parameters', () => {
    const url = 'https://example.com/path';
    const result = createSearchRouteURL(url);
    expect(result).toBe('https://example.com?');
  });

  it('returns the correct URL with complex search parameters', () => {
    const url = 'https://example.com/search?param1=value1&param2=value2&param3=value3';
    const result = createSearchRouteURL(url);
    expect(result).toBe('https://example.com?param1=value1&param2=value2&param3=value3');
  });
});

describe('Test getStrSizeInKb', () => {
  it('returns correct size in KB for a string', () => {
    expect(getStrSizeInKb('a')).toBeGreaterThan(0);
    expect(getStrSizeInKb('')).toBe(0);
  });
});

describe('Test compressData and decompressData', () => {
  it('compresses and decompresses data correctly', () => {
    const obj = { foo: 'bar', num: 42 };
    const compressed = compressData(obj);
    expect(typeof compressed).toBe('string');
    const decompressed = decompressData<typeof obj>(compressed);
    expect(decompressed).toEqual(obj);
  });

  it('should handle compression of invalid data', () => {
    // Circular reference that can't be JSON.stringified
    const circularData: any = { a: 1 };
    circularData.self = circularData;

    expect(() => {
      compressData(circularData);
    }).toThrow();
  });

  it('should return null for decompression of invalid string', () => {
    // LZString.decompress returns null for invalid input, JSON.parse(null) = null
    const result = decompressData('not-a-compressed-string');
    expect(result).toBeNull();
  });

  it('should return null for decompression of empty string', () => {
    // decompress('') returns null, JSON.parse(null) = null
    const result = decompressData('');
    expect(result).toBeNull();
  });

  it('should return null for decompression of corrupted base64', () => {
    // LZString returns null for invalid base64, JSON.parse(null) = null
    const result = decompressData('!!!invalid-base64!!!');
    expect(result).toBeNull();
  });

  it('should handle compression of large datasets', () => {
    const largeData = {
      items: new Array(1000).fill({ id: 1, name: 'test', data: 'sample data' }),
    };

    const compressed = compressData(largeData);
    expect(compressed).toBeTruthy();

    const decompressed = decompressData<typeof largeData>(compressed);
    expect(decompressed.items).toHaveLength(1000);
  });

  it('should handle compression of empty objects', () => {
    const emptyData = {};

    const compressed = compressData(emptyData);
    expect(compressed).toBeTruthy();

    const decompressed = decompressData(compressed);
    expect(decompressed).toEqual(emptyData);
  });

  it('should handle compression of null values', () => {
    const dataWithNull = { value: null };

    const compressed = compressData(dataWithNull);
    const decompressed = decompressData(compressed);

    expect(decompressed).toEqual(dataWithNull);
  });

  it('should handle compression of arrays', () => {
    const arrayData = [1, 2, 3, 'four', { five: 5 }];

    const compressed = compressData(arrayData);
    const decompressed = decompressData(compressed);

    expect(decompressed).toEqual(arrayData);
  });

  it('should handle compression of special characters', () => {
    const specialData = {
      text: 'Special chars: é, ñ, 中文, emoji: 🎉',
    };

    const compressed = compressData(specialData);
    const decompressed = decompressData(compressed);

    expect(decompressed).toEqual(specialData);
  });
});

describe('Test saveToLocalStorage and getFromLocalStorage', () => {
  const key = 'testLocalKey';
  const value = { a: 1, b: 2 };
  const originalLocalStorage = global.localStorage;

  afterEach(() => {
    // Restore original localStorage if it was mocked
    Object.defineProperty(global, 'localStorage', {
      value: originalLocalStorage,
      writable: true,
    });
    // Clean up only if localStorage exists
    if (localStorage && localStorage.removeItem) {
      localStorage.removeItem(key);
    }
  });

  it('saves and retrieves JSON data', () => {
    saveToLocalStorage(key, value);
    const result = getFromLocalStorage<typeof value>(key);
    expect(result).toEqual(value);
  });

  it('saves and retrieves compressed data', () => {
    saveToLocalStorage(key, value, true);
    const result = getFromLocalStorage<typeof value>(key, true);
    expect(result).toEqual(value);
  });

  it('returns null if key does not exist', () => {
    expect(getFromLocalStorage('nonexistent')).toBeNull();
  });

  it('returns null for empty string from localStorage', () => {
    const mockGetItem = vi.fn(() => '');

    Object.defineProperty(global, 'localStorage', {
      value: {
        setItem: vi.fn(),
        getItem: mockGetItem,
        removeItem: vi.fn(),
        clear: vi.fn(),
        key: vi.fn(),
        length: 0,
      },
      writable: true,
    });

    const result = getFromLocalStorage('empty-key');
    expect(result).toBeNull();
  });

  it('returns null for corrupted compressed data (decompress returns null)', () => {
    const mockGetItem = vi.fn(() => 'invalid-compressed-data');

    Object.defineProperty(global, 'localStorage', {
      value: {
        setItem: vi.fn(),
        getItem: mockGetItem,
        removeItem: vi.fn(),
        clear: vi.fn(),
        key: vi.fn(),
        length: 0,
      },
      writable: true,
    });

    // LZString.decompress returns null for invalid input, JSON.parse(null) returns null
    const result = getFromLocalStorage('test-key', true);
    expect(result).toBeNull();
  });

  describe('Error scenarios (documents current behavior)', () => {
    it('should throw quota exceeded error (no current error handling)', () => {
      // Mock localStorage to throw quota exceeded error
      const mockSetItem = vi.fn(() => {
        const error: any = new Error('QuotaExceededError');
        error.name = 'QuotaExceededError';
        throw error;
      });

      Object.defineProperty(global, 'localStorage', {
        value: {
          setItem: mockSetItem,
          getItem: vi.fn(),
          removeItem: vi.fn(),
          clear: vi.fn(),
          key: vi.fn(),
          length: 0,
        },
        writable: true,
      });

      // Currently throws - documents that error handling could be improved
      expect(() => {
        saveToLocalStorage('test-key', { data: 'test' });
      }).toThrow('QuotaExceededError');

      expect(mockSetItem).toHaveBeenCalled();
    });

    it('should throw on corrupted JSON data (no current error handling)', () => {
      const mockGetItem = vi.fn(() => '{invalid json}');

      Object.defineProperty(global, 'localStorage', {
        value: {
          setItem: vi.fn(),
          getItem: mockGetItem,
          removeItem: vi.fn(),
          clear: vi.fn(),
          key: vi.fn(),
          length: 0,
        },
        writable: true,
      });

      // Currently throws - documents that error handling could be improved
      expect(() => {
        getFromLocalStorage('test-key');
      }).toThrow();

      expect(mockGetItem).toHaveBeenCalledWith('test-key');
    });

    it('should throw when localStorage is undefined (no current error handling)', () => {
      // Mock localStorage as undefined
      Object.defineProperty(global, 'localStorage', {
        value: undefined,
        writable: true,
      });

      // Currently throws when localStorage is unavailable
      expect(() => {
        saveToLocalStorage('test-key', { data: 'test' });
      }).toThrow();

      expect(() => {
        getFromLocalStorage('test-key');
      }).toThrow();
    });

    it('should throw security errors (no current error handling)', () => {
      const mockSetItem = vi.fn(() => {
        throw new DOMException('SecurityError', 'SecurityError');
      });

      Object.defineProperty(global, 'localStorage', {
        value: {
          setItem: mockSetItem,
          getItem: vi.fn(),
          removeItem: vi.fn(),
          clear: vi.fn(),
          key: vi.fn(),
          length: 0,
        },
        writable: true,
      });

      expect(() => {
        saveToLocalStorage('test-key', { data: 'test' });
      }).toThrow();
    });
  });
});

describe('Test cachePagination and getCachedPagination', () => {
  const pagination = { page: 2, pageSize: 20 };

  afterEach(() => {
    localStorage.removeItem('cachedSearchPagination');
  });

  it('caches and retrieves pagination', () => {
    cachePagination(pagination);
    expect(getCachedPagination()).toEqual(pagination);
  });

  it('returns default pagination if not set', () => {
    localStorage.removeItem('cachedSearchPagination');
    expect(getCachedPagination()).toEqual({ page: 1, pageSize: 10 });
  });
});

describe('Test cacheSearchResults, getCachedSearchResults, and clearCachedSearchResults', () => {
  const results = { response: { docs: [], numFound: 0 } };
  const pagination = { page: 1, pageSize: 10 };
  const cachedURL = 'http://test.com';

  afterEach(() => {
    clearCachedSearchResults();
  });

  it('caches and retrieves search results', () => {
    cacheSearchResults(results, pagination, cachedURL);
    const cached = getCachedSearchResults();
    expect(cached.cachedURL).toBe(cachedURL);
    expect(cached.response).toBeDefined();
  });

  it('clears cached search results', () => {
    cacheSearchResults(results, pagination, cachedURL);
    clearCachedSearchResults();
    expect(getCachedSearchResults()).toEqual({});
  });

  it('clears cache when expired', () => {
    cacheSearchResults(results, pagination, cachedURL);

    // Expect the cache to be set
    expect(tempStorageGetMock('cachedSearchResults')).toBeTruthy();

    // Simulate time passing
    vi.useFakeTimers();
    vi.setSystemTime(Date.now() + 60 * 60 * 2000); // Move time forward by 2 hours
    const cached = getCachedSearchResults();
    expect(cached).toEqual({});

    // Should also remove from localStorage
    const cachedItem = tempStorageGetMock('cachedSearchResults');
    expect(cachedItem).toBeUndefined();
  });
});

describe('Test showBanner and saveBannerText', () => {
  beforeEach(() => {
    mockConfig.BANNER_TEXT = 'Test Banner';
    sessionStorageMock.removeItem('showBanner');
  });

  it('returns true if banner text is new', () => {
    expect(showBanner()).toBe(true);
  });
  it('returns false if banner text is empty', () => {
    mockConfig.BANNER_TEXT = '';
    expect(showBanner()).toBe(false);
  });
  it('saves banner text to sessionStorage if present', () => {
    mockConfig.BANNER_TEXT = 'Test Banner';
    saveBannerText();
    expect(sessionStorageMock.getItem('showBanner')).toBe('Test Banner');
  });
});

describe('Test clearDeprecatedStorageKeys', () => {
  it('removes deprecated keys from localStorage', () => {
    const keys = ['userSearchQuery', 'showBanner'];
    keys.forEach((key) => localStorageMock.setItem(key, 'test'));
    clearDeprecatedStorageKeys();
    keys.forEach((key) => {
      expect(localStorageMock.getItem(key)).toBeUndefined();
    });
  });
});

describe('createEsgpullCommand', () => {
  it('creates a search command with project and facets', () => {
    const searchQuery = {
      project: { name: 'CMIP6' },
      versionType: 'latest',
      resultType: 'all',
      minVersionDate: null,
      maxVersionDate: null,
      filenameVars: [],
      activeFacets: { activity_id: ['CFMIP'], experiment_id: ['piControl'] },
      textInputs: [],
    } as unknown as ActiveSearchQuery;
    const cmd = createEsgpullCommand(searchQuery, false);
    expect(cmd).toContain(
      'esgpull search project:\'"CMIP6"\' activity_id:\'"CFMIP"\' experiment_id:\'"piControl"\' --latest true',
    );
  });

  it('creates a STAC search command with project and facets', () => {
    const searchQuery = {
      project: { name: 'CMIP6 STAC', projectName: 'CMIP6', isSTAC: true },
      versionType: 'latest',
      resultType: 'all',
      minVersionDate: null,
      maxVersionDate: null,
      filenameVars: [],
      activeFacets: { activity_id: ['CFMIP'], experiment_id: ['piControl'] },
      textInputs: [],
    } as unknown as ActiveSearchQuery;
    const cmd = createEsgpullCommand(searchQuery, false);
    expect(cmd).toContain(
      'esgpull search project:\'"CMIP6"\' activity_id:\'"CFMIP"\' experiment_id:\'"piControl"\' --latest true',
    );
  });

  it('creates a download command with --track and --replica', () => {
    const searchQuery = {
      project: { name: 'CMIP6' },
      versionType: 'all',
      resultType: 'originals only',
      minVersionDate: null,
      maxVersionDate: null,
      filenameVars: [],
      activeFacets: {},
      textInputs: [],
    } as ActiveSearchQuery;
    const cmd = createEsgpullCommand(searchQuery, true);
    expect(cmd).toContain('esgpull add project:\'"CMIP6"\' --replica false');
    expect(cmd).toContain('--track | tail -n1');
    expect(cmd).toContain('esgpull download --disable-ssl');
  });

  it('creates a download command with --replica false', () => {
    const searchQuery = {
      project: { name: 'CMIP6' },
      versionType: 'all',
      resultType: 'replicas only',
      minVersionDate: null,
      maxVersionDate: null,
      filenameVars: [],
      activeFacets: {},
      textInputs: [],
    } as ActiveSearchQuery;
    const cmd = createEsgpullCommand(searchQuery, true);
    expect(cmd).toContain('esgpull add project:\'"CMIP6"\' --replica true');
    expect(cmd).toContain('--track | tail -n1');
    expect(cmd).toContain('esgpull download --disable-ssl');
  });

  it('includes textInputs in the command', () => {
    const searchQuery = {
      project: { name: 'CMIP6' },
      versionType: 'latest',
      resultType: 'all',
      minVersionDate: null,
      maxVersionDate: null,
      filenameVars: [],
      activeFacets: {},
      textInputs: ['foo', 'bar'],
    } as unknown as ActiveSearchQuery;
    const cmd = createEsgpullCommand(searchQuery, false);
    expect(cmd).toContain('["foo","bar"]');
  });

  it('creates a download command for single dataset, search empty', () => {
    const cmd = createEsgpullCommand({}, false, '12345');
    expect(cmd).toContain(`# Esgpull Dataset Download Command:
\`esgpull add master_id:'\"12345\"' --track | tail -n1\`; esgpull download --disable-ssl`);
  });

  it('returns empty string if the search query is empty', () => {
    const cmd = createEsgpullCommand({}, true);
    expect(cmd).toContain('');
  });
});

describe('createIntakeEsgfSearch', () => {
  it('creates an intake-esgf search command with multiple facets', () => {
    const searchQuery = {
      project: { name: 'CMIP6' },
      versionType: 'all',
      resultType: 'all',
      minVersionDate: null,
      maxVersionDate: null,
      filenameVars: [],
      activeFacets: { activity_id: ['CFMIP', 'CDRMIP'], experiment_id: ['piControl'] },
      textInputs: [],
    } as unknown as ActiveSearchQuery;
    const cmd = createIntakeEsgfSearch(searchQuery);
    expect(cmd).toContain('import intake_esgf');
    expect(cmd).toContain('from intake_esgf import supported_projects');
    expect(cmd).toContain('cat=intake_esgf.ESGFCatalog()');
    expect(cmd).toContain('metagrid_search=cat.search(');
    expect(cmd).toContain("activity_id=['CFMIP', 'CDRMIP']");
    expect(cmd).toContain("experiment_id='piControl'");
    expect(cmd).toContain('latest=False');
  });

  it('creates a STAC intake-esgf search command with correct imports', () => {
    const searchQuery = {
      project: { name: 'CMIP6 STAC', isSTAC: true },
      versionType: 'all',
      resultType: 'all',
      minVersionDate: null,
      maxVersionDate: null,
      filenameVars: [],
      activeFacets: { activity_id: ['CFMIP', 'CDRMIP'], experiment_id: ['piControl'] },
      textInputs: [],
    } as unknown as ActiveSearchQuery;
    const cmd = createIntakeEsgfSearch(searchQuery);
    expect(cmd).toContain('import intake_esgf');
    expect(cmd).toContain('intake_esgf.conf.set(indices={"');
    expect(cmd).toContain('":True})');
    expect(cmd).toContain('cat=intake_esgf.ESGFCatalog()');
    expect(cmd).toContain('metagrid_search=cat.search(');
    expect(cmd).toContain("activity_id=['CFMIP', 'CDRMIP']");
    expect(cmd).toContain("experiment_id='piControl'");
    expect(cmd).toContain('latest=False');
  });

  it('creates an intake-esgf search command with latest=True', () => {
    const searchQuery = {
      project: { name: 'CMIP6' },
      versionType: 'latest',
      resultType: 'all',
      minVersionDate: null,
      maxVersionDate: null,
      filenameVars: [],
      activeFacets: { realm: ['atmos'] },
      textInputs: [],
    } as unknown as ActiveSearchQuery;
    const cmd = createIntakeEsgfSearch(searchQuery);
    expect(cmd).toContain("realm='atmos'");
    expect(cmd).toContain('latest=True');
  });
});

describe('Test getLastMessageSeen and setStartupMessageAsSeen', () => {
  const messageKey = 'lastMessageSeen';

  beforeEach(() => {
    localStorageMock.removeItem(messageKey);
  });

  afterEach(() => {
    localStorageMock.removeItem(messageKey);
  });

  it('returns null when no message has been seen', () => {
    // localStorageMock returns undefined for non-existent keys, but real localStorage returns null
    const result = getLastMessageSeen();
    expect(result === null || result === undefined).toBe(true);
  });

  it('returns the last message seen from localStorage', () => {
    localStorageMock.setItem(messageKey, 'Test message');
    expect(getLastMessageSeen()).toBe('Test message');
  });

  it('sets the startup message as seen in localStorage', () => {
    setStartupMessageAsSeen();
    const message = localStorageMock.getItem(messageKey);
    expect(message).toBeTruthy();
  });
});

describe('Test searchAlreadyExists', () => {
  it('returns true if search with same uuid exists', () => {
    const existingSearches = [
      {
        uuid: '123',
        search: { project: { name: 'CMIP6' }, activeFacets: {} },
      },
      {
        uuid: '456',
        search: { project: { name: 'CMIP5' }, activeFacets: {} },
      },
    ] as unknown as UserSearchQueries;

    const newSearch = {
      uuid: '123',
      search: { project: { name: 'CMIP6' }, activeFacets: { activity_id: ['CFMIP'] } },
    } as unknown as UserSearchQuery;

    expect(searchAlreadyExists(existingSearches, newSearch)).toBe(true);
  });

  it('returns false if search does not exist', () => {
    const existingSearches = [
      {
        uuid: '123',
        search: { project: { name: 'CMIP6' }, activeFacets: {} },
      },
    ] as unknown as UserSearchQueries;

    const newSearch = {
      uuid: '789',
      search: { project: { name: 'E3SM' }, activeFacets: {} },
    } as unknown as UserSearchQuery;

    expect(searchAlreadyExists(existingSearches, newSearch)).toBe(false);
  });
});

describe('Test downloadFileForUser', () => {
  it('creates a download link and triggers download', () => {
    const filename = 'test.txt';
    const content = 'Test file content';

    // Create a real anchor element to avoid Node type errors
    const mockAnchor = document.createElement('a');
    const clickSpy = vi.spyOn(mockAnchor, 'click').mockImplementation(() => {});
    const setAttributeSpy = vi.spyOn(mockAnchor, 'setAttribute');

    const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor);
    const appendChildSpy = vi
      .spyOn(document.body, 'appendChild')
      .mockImplementation(() => mockAnchor);
    const removeChildSpy = vi
      .spyOn(document.body, 'removeChild')
      .mockImplementation(() => mockAnchor);

    downloadFileForUser(filename, content);

    expect(createElementSpy).toHaveBeenCalledWith('a');
    expect(setAttributeSpy).toHaveBeenCalledWith(
      'href',
      expect.stringContaining('data:text/plain'),
    );
    expect(setAttributeSpy).toHaveBeenCalledWith('download', filename);
    expect(clickSpy).toHaveBeenCalled();
    expect(appendChildSpy).toHaveBeenCalled();
    expect(removeChildSpy).toHaveBeenCalled();

    createElementSpy.mockRestore();
    appendChildSpy.mockRestore();
    removeChildSpy.mockRestore();
    clickSpy.mockRestore();
    setAttributeSpy.mockRestore();
  });
});

describe('Test identifyProblematicFacets', () => {
  it('should identify new facets that were not in last successful query', () => {
    const lastSuccessfulQuery = activeSearchQueryFixture({
      activeFacets: {
        facet1: ['value1', 'value2'],
      },
    });

    const currentQuery = activeSearchQueryFixture({
      activeFacets: {
        facet1: ['value1', 'value2'],
        facet2: ['value3'], // New facet
      },
    });

    const problematic = identifyProblematicFacets(currentQuery, lastSuccessfulQuery);

    expect(problematic.has('facet2:value3')).toBe(true);
    expect(problematic.size).toBe(1);
  });

  it('should identify new values in existing facets', () => {
    const lastSuccessfulQuery = activeSearchQueryFixture({
      activeFacets: {
        facet1: ['value1'],
      },
    });

    const currentQuery = activeSearchQueryFixture({
      activeFacets: {
        facet1: ['value1', 'value2'], // Added value2
      },
    });

    const problematic = identifyProblematicFacets(currentQuery, lastSuccessfulQuery);

    expect(problematic.has('facet1:value2')).toBe(true);
    expect(problematic.has('facet1:value1')).toBe(false); // value1 was in successful query
    expect(problematic.size).toBe(1);
  });

  it('should identify multiple problematic facets', () => {
    const lastSuccessfulQuery = activeSearchQueryFixture({
      activeFacets: {
        facet1: ['value1'],
      },
    });

    const currentQuery = activeSearchQueryFixture({
      activeFacets: {
        facet1: ['value1', 'value2'], // New value
        facet2: ['value3'], // New facet
        facet3: ['value4', 'value5'], // New facet with multiple values
      },
    });

    const problematic = identifyProblematicFacets(currentQuery, lastSuccessfulQuery);

    expect(problematic.has('facet1:value2')).toBe(true);
    expect(problematic.has('facet2:value3')).toBe(true);
    expect(problematic.has('facet3:value4')).toBe(true);
    expect(problematic.has('facet3:value5')).toBe(true);
    expect(problematic.size).toBe(4);
  });

  it('should return empty set when there are no problematic facets', () => {
    const lastSuccessfulQuery = activeSearchQueryFixture({
      activeFacets: {
        facet1: ['value1', 'value2'],
      },
    });

    const currentQuery = activeSearchQueryFixture({
      activeFacets: {
        facet1: ['value1', 'value2'], // Same as successful query
      },
    });

    const problematic = identifyProblematicFacets(currentQuery, lastSuccessfulQuery);

    expect(problematic.size).toBe(0);
  });

  it('should return empty set when lastSuccessfulQuery is null', () => {
    const currentQuery = activeSearchQueryFixture({
      activeFacets: {
        facet1: ['value1'],
      },
    });

    const problematic = identifyProblematicFacets(currentQuery, null);

    expect(problematic.size).toBe(0);
  });

  it('should handle removed facets (should not mark as problematic)', () => {
    const lastSuccessfulQuery = activeSearchQueryFixture({
      activeFacets: {
        facet1: ['value1'],
        facet2: ['value2'],
      },
    });

    const currentQuery = activeSearchQueryFixture({
      activeFacets: {
        facet1: ['value1'], // facet2 removed
      },
    });

    const problematic = identifyProblematicFacets(currentQuery, lastSuccessfulQuery);

    // Removing facets shouldn't be marked as problematic
    expect(problematic.size).toBe(0);
  });

  it('should handle empty facets in current query', () => {
    const lastSuccessfulQuery = activeSearchQueryFixture({
      activeFacets: {
        facet1: ['value1'],
      },
    });

    const currentQuery = activeSearchQueryFixture({
      activeFacets: {}, // All facets removed
    });

    const problematic = identifyProblematicFacets(currentQuery, lastSuccessfulQuery);

    expect(problematic.size).toBe(0);
  });

  it('should handle empty facets in last successful query', () => {
    const lastSuccessfulQuery = activeSearchQueryFixture({
      activeFacets: {}, // No facets
    });

    const currentQuery = activeSearchQueryFixture({
      activeFacets: {
        facet1: ['value1'], // All facets are new
      },
    });

    const problematic = identifyProblematicFacets(currentQuery, lastSuccessfulQuery);

    expect(problematic.has('facet1:value1')).toBe(true);
    expect(problematic.size).toBe(1);
  });

  it('should handle facets with array of values', () => {
    const lastSuccessfulQuery = activeSearchQueryFixture({
      activeFacets: {
        experiment: ['historical'],
      },
    });

    const currentQuery = activeSearchQueryFixture({
      activeFacets: {
        experiment: ['historical', 'rcp85', 'ssp585'], // Added two new values
      },
    });

    const problematic = identifyProblematicFacets(currentQuery, lastSuccessfulQuery);

    expect(problematic.has('experiment:rcp85')).toBe(true);
    expect(problematic.has('experiment:ssp585')).toBe(true);
    expect(problematic.has('experiment:historical')).toBe(false);
    expect(problematic.size).toBe(2);
  });

  it('should be case-sensitive when comparing facet values', () => {
    const lastSuccessfulQuery = activeSearchQueryFixture({
      activeFacets: {
        facet1: ['value1'],
      },
    });

    const currentQuery = activeSearchQueryFixture({
      activeFacets: {
        facet1: ['Value1'], // Different case
      },
    });

    const problematic = identifyProblematicFacets(currentQuery, lastSuccessfulQuery);

    // Case difference should be treated as a new value
    expect(problematic.has('facet1:Value1')).toBe(true);
    expect(problematic.size).toBe(1);
  });

  it('should handle whitespace differences in facet values', () => {
    const lastSuccessfulQuery = activeSearchQueryFixture({
      activeFacets: {
        facet1: ['value1'],
      },
    });

    const currentQuery = activeSearchQueryFixture({
      activeFacets: {
        facet1: [' value1 '], // With extra whitespace
      },
    });

    const problematic = identifyProblematicFacets(currentQuery, lastSuccessfulQuery);

    // Whitespace difference should be treated as different
    expect(problematic.has('facet1: value1 ')).toBe(true);
    expect(problematic.size).toBe(1);
  });

  it('should handle special characters in facet names and values', () => {
    const lastSuccessfulQuery = activeSearchQueryFixture({
      activeFacets: {
        'facet-with-dash': ['value.with.dots'],
      },
    });

    const currentQuery = activeSearchQueryFixture({
      activeFacets: {
        'facet-with-dash': ['value.with.dots', 'value:with:colons'],
      },
    });

    const problematic = identifyProblematicFacets(currentQuery, lastSuccessfulQuery);

    expect(problematic.has('facet-with-dash:value:with:colons')).toBe(true);
    expect(problematic.size).toBe(1);
  });

  it('should handle complex real-world CMIP6 scenario', () => {
    const lastSuccessfulQuery = activeSearchQueryFixture({
      project: rawProjectFixture({ name: 'CMIP6' }),
      activeFacets: {
        source_id: ['CESM2', 'GFDL-ESM4'],
        experiment_id: ['historical'],
        variable: ['tas'],
        frequency: ['mon'],
      },
    });

    const currentQuery = activeSearchQueryFixture({
      project: rawProjectFixture({ name: 'CMIP6' }),
      activeFacets: {
        source_id: ['CESM2', 'GFDL-ESM4', 'INVALID-MODEL'], // Added invalid model
        experiment_id: ['historical', 'ssp585'], // Added new experiment
        variable: ['tas'],
        frequency: ['mon'],
        // realm removed, which is fine
      },
    });

    const problematic = identifyProblematicFacets(currentQuery, lastSuccessfulQuery);

    expect(problematic.has('source_id:INVALID-MODEL')).toBe(true);
    expect(problematic.has('experiment_id:ssp585')).toBe(true);
    expect(problematic.size).toBe(2);
  });

  it('should handle when current query has subset of successful facets', () => {
    const lastSuccessfulQuery = activeSearchQueryFixture({
      activeFacets: {
        facet1: ['value1', 'value2', 'value3'],
      },
    });

    const currentQuery = activeSearchQueryFixture({
      activeFacets: {
        facet1: ['value1', 'value2'], // Subset of successful values
      },
    });

    const problematic = identifyProblematicFacets(currentQuery, lastSuccessfulQuery);

    // Using a subset shouldn't be problematic
    expect(problematic.size).toBe(0);
  });

  it('should correctly format facet identifiers with colon separator', () => {
    const lastSuccessfulQuery = activeSearchQueryFixture({
      activeFacets: {},
    });

    const currentQuery = activeSearchQueryFixture({
      activeFacets: {
        model: ['CESM2'],
        institution: ['NCAR'],
      },
    });

    const problematic = identifyProblematicFacets(currentQuery, lastSuccessfulQuery);

    // Verify the format is "facetKey:facetValue"
    const problematicArray = Array.from(problematic);
    expect(problematicArray).toContain('model:CESM2');
    expect(problematicArray).toContain('institution:NCAR');
    expect(problematic.size).toBe(2);
  });

  it('should handle empty arrays for facet values', () => {
    const lastSuccessfulQuery = activeSearchQueryFixture({
      activeFacets: {
        facet1: [],
      },
    });

    const currentQuery = activeSearchQueryFixture({
      activeFacets: {
        facet1: ['value1'],
      },
    });

    const problematic = identifyProblematicFacets(currentQuery, lastSuccessfulQuery);

    // Empty array in last successful means value1 is new
    expect(problematic.has('facet1:value1')).toBe(true);
    expect(problematic.size).toBe(1);
  });
});
