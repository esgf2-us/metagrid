/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { render, wait, fireEvent } from '@testing-library/react';

import FilesTable, { genDownloadUrls, openDownloadUrl } from './FilesTable';
import mockAxios from '../../__mocks__/axios';

// Reset all mocks after each test
afterEach(() => {
  jest.clearAllMocks();
});

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

    // TODO Error: Not implemented: window.open
    // expect(mockedOpen).toBeCalled();
  });
});

describe('test FilesTable component', () => {
  it('returns Alert when there is an error fetching files', async () => {
    const errorMessage = 'Network Error';

    mockAxios.get.mockImplementationOnce(() =>
      Promise.reject(new Error(errorMessage))
    );
    const id = 'testid';
    const { queryByText } = render(<FilesTable id={id} />);

    expect(mockAxios.get).toHaveBeenCalledTimes(1);
    expect(mockAxios.get).toHaveBeenCalledWith(
      `http://localhost:8080/https://esgf-node.llnl.gov/search_files/${id}//esgf-node.llnl.gov/?limit=10`
    );

    await wait(() =>
      expect(
        queryByText(
          'There was an issue fetching files for this dataset. Please contact support for assistance or try again later.'
        )
      ).toBeTruthy()
    );
  });

  it('returns TableD after succesfully fetching files', async () => {
    mockAxios.get.mockImplementationOnce(() =>
      Promise.resolve({
        data: {
          response: {
            docs: [
              {
                id: 'id',
                title: 'title',
                checksum: 'checksum',
                url: ['https://testdownload.com|HTTPServer'],
              },
            ],
          },
        },
      })
    );

    const id = 'testid';
    const { getByTestId } = render(<FilesTable id={id} />);

    expect(mockAxios.get).toHaveBeenCalledTimes(1);
    expect(mockAxios.get).toHaveBeenCalledWith(
      `http://localhost:8080/https://esgf-node.llnl.gov/search_files/${id}//esgf-node.llnl.gov/?limit=10`
    );

    await wait(() => expect(getByTestId('filesTable')).toBeTruthy());
  });

  it('it returns null by default', async () => {
    mockAxios.get.mockImplementationOnce(() =>
      Promise.resolve({
        data: undefined,
      })
    );

    const id = 'testid';
    expect(mockAxios.get).toHaveBeenCalledTimes(0);
    const { container } = render(<FilesTable id={id} />);

    await wait(() => expect(container.firstChild).toBeNull());
  });

  it('opens up a new window when submitting form for downloading a file', async () => {
    mockAxios.get.mockImplementationOnce(() =>
      Promise.resolve({
        data: {
          response: {
            docs: [
              {
                id: 'id',
                title: 'title',
                checksum: 'checksum',
                url: ['https://testdownload.com|HTTPServer'],
              },
            ],
          },
        },
      })
    );

    // Setup windowSpy mock
    const mockedOpen = jest.fn();
    const windowSpy = jest.spyOn(global, 'window', 'get');
    const url = 'https://testdownload.com';

    const id = 'testid';
    const { getByTestId } = render(<FilesTable id={id} />);

    // Check Axios mock
    expect(mockAxios.get).toHaveBeenCalledTimes(1);
    expect(mockAxios.get).toHaveBeenCalledWith(
      `http://localhost:8080/https://esgf-node.llnl.gov/search_files/${id}//esgf-node.llnl.gov/?limit=10`
    );

    // Check filesTable rendered
    await wait(() => expect(getByTestId('filesTable')).toBeTruthy());

    // Check that the new window matches the url
    const originalWindow = { ...window };
    windowSpy.mockImplementation(() => ({
      ...originalWindow,
      location: {
        origin: url,
      },
      open: mockedOpen,
    }));

    // Submit the download form
    fireEvent.submit(getByTestId('download-form'));

    expect(window.location.origin).toEqual(url);

    // # TODO:
    // expect(mockedOpen).toBeCalled();
    windowSpy.mockRestore();
  });
});
