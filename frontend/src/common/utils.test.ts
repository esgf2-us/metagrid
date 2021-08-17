import { ActiveSearchQuery } from '../components/Search/types';
import {
  formatBytes,
  getSearchFromUrl,
  getUrlFromSearch,
  objectHasKey,
  objectIsEmpty,
  shallowCompareObjects,
  splitStringByChar,
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
  it('returns basic url with project parameter when search contains project', () => {
    expect(
      getUrlFromSearch({
        project: { name: 'CMIP6' },
      } as ActiveSearchQuery).includes('?project=CMIP6')
    ).toBeTruthy();
  });
});

describe('Test getSearchFromUrl', () => {
  it('returns basic search object of no search params are in url', () => {
    expect(getSearchFromUrl()).toBeTruthy();
  });
  it('returns search object of specific project', () => {
    expect(
      getSearchFromUrl(
        '?project=CMIP5&data=%7B%22versionType%22%3A%22latest%22%2C%22resultType%22%3A%22all%22%2C%22minVersionDate%22%3Anull%2C%22maxVersionDate%22%3Anull%2C%22filenameVars%22%3A%5B%5D%2C%22activeFacets%22%3A%7B%7D%2C%22textInputs%22%3A%5B%5D%7D'
      )
    ).toBeTruthy();
  });
});
