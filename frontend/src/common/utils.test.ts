import {
  formatBytes,
  objectHasKey,
  objectIsEmpty,
  shallowCompareObjects,
  splitURLByChar,
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

describe('Test splitURLbyChar', () => {
  let url: string;
  beforeEach(() => {
    url = 'first.com|second.com';
  });
  it('returns first half of the split', () => {
    expect(splitURLByChar(url, '|', 'first')).toEqual('first.com');
  });
  it('returns second half of the split', () => {
    expect(splitURLByChar(url, '|', 'second')).toEqual('second.com');
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
