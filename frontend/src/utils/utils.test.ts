import { isEmpty, formatBytes, humanize, hasKey } from './utils';

describe('Test isEmpty', () => {
  test('isEmpty returns true with empty object', () => {
    expect(isEmpty({})).toBeTruthy();
  });

  test('isEmpty returns false with non-empty object', () => {
    const testObj = { key1: 1, key2: 2 };
    expect(isEmpty(testObj)).toBeFalsy();
  });
});

describe('Test humanize', () => {
  test('humanize removes underscore and lowercases', () => {
    expect(humanize('camel_case')).toEqual('Camel Case');
  });

  test('humanize does not change properly formatted text ', () => {
    expect(humanize('Proper Text')).toEqual('Proper Text');
  });
});

describe('Test hasKey', () => {
  it('returns true if key is found', () => {
    const testObj = { findKey: 'yup' };

    expect(hasKey(testObj, 'findKey')).toBeTruthy();
  });

  it('returns false if key is not found ', () => {
    const testObj = {};
    expect(hasKey(testObj, 'findKey')).toBeFalsy();
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
