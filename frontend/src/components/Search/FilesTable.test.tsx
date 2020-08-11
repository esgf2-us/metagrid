/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { render, waitFor, fireEvent, within } from '@testing-library/react';

import FilesTable, {
  genDownloadUrls,
  openDownloadUrl,
  DownloadUrls,
  Props,
} from './FilesTable';
import apiRoutes from '../../api/routes';
import { server, rest } from '../../api/mock/setup-env';

// Reset all mocks after each test
afterEach(() => {
  jest.clearAllMocks();
});

describe('test genDownloadUrls()', () => {
  let urls: string[];
  let result: DownloadUrls;
  beforeEach(() => {
    urls = [
      'http://test.com|HTTPServer',
      'http://test.com|Globus',
      'http://test.com/file.html|OPeNDAP',
    ];
    result = [
      { downloadType: 'HTTPServer', downloadUrl: 'http://test.com' },
      { downloadType: 'Globus', downloadUrl: 'http://test.com' },
      { downloadType: 'OPeNDAP', downloadUrl: 'http://test.com/file.dods' },
    ];
  });

  it('successfully converts array of urls to array of objects containing download type and download url', () => {
    const newUrls = genDownloadUrls(urls);
    expect(newUrls).toEqual(result);
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

    openDownloadUrl(url);
    expect(window.location.origin).toEqual('https://example.com');
  });
});

const defaultProps: Props = {
  id: 'id',
};

describe('test FilesTable component', () => {
  it('returns Alert when there is an error fetching files', async () => {
    server.use(
      rest.get(apiRoutes.esgfFiles, (_req, res, ctx) => {
        return res(ctx.status(404));
      })
    );

    const { getByRole } = render(<FilesTable {...defaultProps} />);
    const alertMsg = await waitFor(() =>
      getByRole('img', { name: 'close-circle', hidden: true })
    );
    expect(alertMsg).toBeTruthy();
  });

  it('renders files table with data and opens up a new window when submitting form for downloading a file', async () => {
    // Update the value of open
    // https://stackoverflow.com/questions/58189851/mocking-a-conditional-window-open-function-call-with-jest
    Object.defineProperty(window, 'open', { value: jest.fn() });

    const { getByRole, getByTestId } = render(<FilesTable {...defaultProps} />);

    // Check files table componet renders
    const filesTableComponent = await waitFor(() => getByTestId('filesTable'));
    expect(filesTableComponent).toBeTruthy();

    // Select first cell row
    const firstRow = await waitFor(() =>
      getByRole('row', {
        name: 'foo 1 Bytes HTTPServer download',
      })
    );
    expect(firstRow).toBeTruthy();

    // Select first cell download button
    const downloadBtn = within(firstRow).getByRole('img', {
      name: 'download',
    });
    expect(downloadBtn).toBeTruthy();

    // Submit the download form
    fireEvent.submit(downloadBtn);

    await waitFor(() => getByTestId('filesTable'));
  });
});
