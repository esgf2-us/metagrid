/* eslint-disable react/jsx-props-no-spreading */
import { genDownloadUrls, openDownloadUrl } from './FilesTable';

describe('test genDownloadUrls()', () => {
  let urls;
  let result;
  beforeEach(() => {
    urls = ['http://test.com|HTTPServer', 'http://test.com|Globus'];
    result = [
      { downloadType: 'HTTPServer', downloadUrl: 'http://test.com' },
      { downloadType: 'Globus', downloadUrl: 'http://test.com' },
    ];
  });

  it('successfully converts array of urls to array of objects containing download type and download url', () => {
    const newUrls = genDownloadUrls(urls);
    expect(newUrls).toEqual(result);
  });
});

describe('test openDownloadUrl()', () => {
  let windowSpy;
  let mockedOpen;
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

    openDownloadUrl(url);
    expect(window.location.origin).toEqual('https://example.com');
    expect(mockedOpen).toBeCalled();
  });
});
