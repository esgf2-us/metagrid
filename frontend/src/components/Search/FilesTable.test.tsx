import { within, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { rest, server } from '../../test/mock/server';
import apiRoutes from '../../api/routes';
import FilesTable, { DownloadUrls, genDownloadUrls, Props } from './FilesTable';
import customRender from '../../test/custom-render';
import { ESGFSearchAPIFixture, rawSearchResultFixture } from '../../test/mock/fixtures';
import { RawSearchResult, RawSearchResults } from './types';
import { openDropdownList } from '../../test/jestTestFunctions';

const user = userEvent.setup();

describe('test genDownloadUrls()', () => {
  let urls: string[];
  let result: DownloadUrls;
  beforeEach(() => {
    urls = [
      'http://test.com|HTTPServer',
      'http://test.com|Globus',
      'http://test.com/file.dods|OPENDAP',
    ];
    result = {
      HTTPServer: 'https://test.com',
      OPENDAP: 'http://test.com/file.nc',
    };
  });

  it('converts array of urls to array of objects containing download type and download url', () => {
    let newUrls = genDownloadUrls(urls);
    expect(newUrls).toEqual(result);

    // Test different OpendDap url variations are converted to .nc
    urls = ['http://test.com/file.dods.nc|OPENDAP'];
    result = {
      HTTPServer: '',
      OPENDAP: 'http://test.com/file.nc',
    };
    newUrls = genDownloadUrls(urls);
    expect(newUrls).toEqual(result);

    urls = ['http://test.com/file.dods.html|OPENDAP'];
    result = {
      HTTPServer: '',
      OPENDAP: 'http://test.com/file.nc',
    };
    newUrls = genDownloadUrls(urls);
    expect(newUrls).toEqual(result);

    urls = ['http://test.com/file.dods|OPENDAP'];
    result = {
      HTTPServer: '',
      OPENDAP: 'http://test.com/file.nc',
    };
    newUrls = genDownloadUrls(urls);
    expect(newUrls).toEqual(result);

    urls = ['http://test.com/file.nc.dods|OPENDAP'];
    result = {
      HTTPServer: '',
      OPENDAP: 'http://test.com/file.nc',
    };
    newUrls = genDownloadUrls(urls);
    expect(newUrls).toEqual(result);

    urls = ['http://test.com/file.nc.html|OPENDAP'];
    result = {
      HTTPServer: '',
      OPENDAP: 'http://test.com/file.nc',
    };
    newUrls = genDownloadUrls(urls);
    expect(newUrls).toEqual(result);
  });
  it('converts array of urls to array of objects but ignores HTTPServer URL conversion to HTTPS since it is already HTTPS', () => {
    const updatedUrls = urls;
    updatedUrls[0] = updatedUrls[0].replace('http', 'https');
    const newUrls = genDownloadUrls(updatedUrls);
    expect(newUrls).toEqual(result);
  });
});

const defaultProps: Props = {
  id: 'id',
  numResults: 1,
};

describe('test FilesTable component', () => {
  it('renders an empty data table when no results are available', async () => {
    customRender(<FilesTable {...defaultProps} numResults={undefined} />);

    const component = await screen.findByRole('table');
    expect(component).toBeTruthy();
  });

  it('returns Alert when there is an error fetching files', async () => {
    server.use(rest.get(apiRoutes.esgfSearch.path, (_req, res, ctx) => res(ctx.status(404))));

    customRender(<FilesTable {...defaultProps} />);
    const alertMsg = await screen.findByRole('img', {
      name: 'close-circle',
      hidden: true,
    });
    expect(alertMsg).toBeTruthy();
  });

  it('handles downloading data with httpserver', async () => {
    customRender(<FilesTable {...defaultProps} />);

    // Check component renders
    const component = await screen.findByTestId('filesTable');
    expect(component).toBeTruthy();

    // Wait for component to re-render
    await screen.findByTestId('filesTable');

    // Check a record row exist
    const rows = await screen.findAllByRole('row');
    const row = rows[1];
    expect(row).toBeTruthy();

    // Get the download button
    const downloadBtn = within(row).getByRole('button', {
      name: 'download',
    });
    expect(downloadBtn).toBeTruthy();

    await user.click(downloadBtn);

    // Test the copy button
    const copyBtn = within(row).getByRole('button', {
      name: 'copy',
    });
    expect(copyBtn).toBeTruthy();

    await user.click(copyBtn);

    // Wait for component to re-render
    await screen.findByTestId('filesTable');
  });

  it('handles pagination and page size changes', async () => {
    // Update api to return 20 search results, which enables pagination if 10/page selected
    const data = ESGFSearchAPIFixture();

    const docs = new Array(20)
      .fill(rawSearchResultFixture())
      .map((obj, index) => ({ ...obj, id: `id_${index}` } as RawSearchResult));
    const numFound = docs.length;
    const response = {
      ...data,
      response: {
        docs,
        numFound,
      },
    };
    server.use(
      rest.get(apiRoutes.esgfSearch.path, (_req, res, ctx) =>
        res(ctx.status(200), ctx.json(response))
      )
    );

    customRender(<FilesTable {...defaultProps} numResults={numFound} />);

    // Select the combobox drop down and update its value to render options
    const paginationList = await screen.findByRole('list');
    const pageSizeComboBox = await within(paginationList).findByRole('combobox');

    await openDropdownList(user, pageSizeComboBox);

    await user.click(await screen.findByTestId('pageSize-option-20'));

    expect(screen.getByTestId('search-items-row-11')).toBeInTheDocument();
  });

  it('handles clicking the expandable icon', async () => {
    customRender(<FilesTable {...defaultProps} />);

    // Check component renders
    const component = await screen.findByTestId('filesTable');
    expect(component).toBeTruthy();

    // Wait for component to re-render
    await screen.findByTestId('filesTable');

    // Check a record row exist
    const rows = await screen.findAllByRole('row');
    const row = rows[1];
    expect(row).toBeTruthy();

    // Get the expandable cell
    const expandableCell = within(row).getByRole('cell', {
      name: 'right-circle',
    });
    expect(expandableCell).toBeTruthy();

    // Get the right circle icon within the cell and click to expand the row
    const expandableIcon = within(expandableCell).getByRole('img', {
      name: 'right-circle',
    });
    expect(expandableIcon).toBeTruthy();

    await user.click(expandableIcon);

    // Get the down circle icon within the cell and click to close the expandable row
    const expandableDownIcon = within(expandableCell).getByRole('img', {
      name: 'down-circle',
    });
    expect(expandableDownIcon).toBeTruthy();

    await user.click(expandableDownIcon);
  });
});

describe('test column sorting', () => {
  const response = {
    response: {
      docs: [
        rawSearchResultFixture({
          id: 'zyx',
          title: 'zyx_first',
          size: 5678,
          checksum: 'abcdefghijk',
        }),
        rawSearchResultFixture({
          id: 'abc',
          title: 'abc_last',
          size: 1234,
          checksum: 'abcdefghijk',
        }),
      ],
      numFound: 2,
    },
  } as {
    response: { docs: RawSearchResults };
  };

  it('sorts by File Title column', async () => {
    server.use(
      rest.get(apiRoutes.esgfSearch.path, (_req, res, ctx) =>
        res(ctx.status(200), ctx.json(response))
      )
    );
    const colIdx = 1; // The column that File Title is in
    customRender(<FilesTable id="test" numResults={2} />);

    // Check table exists
    const table = await screen.findByRole('table');
    expect(table).toBeTruthy();

    // Make sure files are loaded
    const loadedRow = await screen.findByText('zyx_first');
    expect(loadedRow).toBeTruthy();

    // First row in table
    const firstRow = (await screen.findAllByRole('row'))[1];
    expect(firstRow).toBeTruthy();

    // Verify current row value
    const cell = (await within(firstRow).findAllByRole('cell'))[colIdx];
    expect(cell).toBeTruthy();
    expect(cell).toHaveTextContent('zyx');

    // Click on the column header to sort
    const tableHeader = await screen.findByText('File Title');
    expect(tableHeader).toBeTruthy();
    await user.click(tableHeader);

    // Updated first row in table
    const updatedRow = (await screen.findAllByRole('row'))[1];
    expect(updatedRow).toBeTruthy();

    // Verify current row value
    const updatedCell = (await within(updatedRow).findAllByRole('cell'))[colIdx];
    expect(updatedCell).toBeTruthy();

    // Verify sorting by checking the row value changed
    expect(updatedCell).toHaveTextContent('abc');
  });

  it('sorts by Size column', async () => {
    server.use(
      rest.get(apiRoutes.esgfSearch.path, (_req, res, ctx) =>
        res(ctx.status(200), ctx.json(response))
      )
    );
    const colIdx = 2; // The column that Size is in
    customRender(<FilesTable {...defaultProps} numResults={2} />);

    // Check table exists
    const table = await screen.findByRole('table');
    expect(table).toBeTruthy();

    // Make sure files are loaded
    const loadedRow = await screen.findByText('zyx_first');
    expect(loadedRow).toBeTruthy();

    // First row in table
    const firstRow = (await screen.findAllByRole('row'))[1];
    expect(firstRow).toBeTruthy();

    // Verify current row value
    const cell = (await within(firstRow).findAllByRole('cell'))[colIdx];
    expect(cell).toBeTruthy();
    expect(cell).toHaveTextContent('5.54 KB');

    // Click on the column header to sort
    const tableHeader = await screen.findByText('Size');
    expect(tableHeader).toBeTruthy();
    await user.click(tableHeader);

    // Updated first row in table
    const updatedRow = (await screen.findAllByRole('row'))[1];
    expect(updatedRow).toBeTruthy();

    // Verify current row value
    const updatedCell = (await within(updatedRow).findAllByRole('cell'))[colIdx];
    expect(updatedCell).toBeTruthy();

    // Verify sorting by checking the row value changed
    expect(updatedCell).toHaveTextContent('1.21 KB');
  });

  it('Handles sorting without breaking even if values are undefined', async () => {
    const response = {
      response: {
        docs: [
          rawSearchResultFixture({
            id: 'zyx',
            title: undefined,
            size: undefined,
            checksum: 'abcdefghijk',
          }),
          rawSearchResultFixture({
            id: 'abc',
            title: undefined,
            size: undefined,
            checksum: 'lmnopqrstuv',
          }),
        ],
        numFound: 2,
      },
    } as {
      response: { docs: RawSearchResults };
    };

    server.use(
      rest.get(apiRoutes.esgfSearch.path, (_req, res, ctx) =>
        res(ctx.status(200), ctx.json(response))
      )
    );
    customRender(<FilesTable {...defaultProps} numResults={2} />);

    // Check table exists
    const table = await screen.findByRole('table');
    expect(table).toBeTruthy();

    // First row in table
    const firstRow = (await screen.findAllByRole('row'))[1];
    expect(firstRow).toBeTruthy();

    // Click on the column header to sort
    const tableDatasetId = await screen.findByText('File Title');
    expect(tableDatasetId).toBeTruthy();
    await user.click(tableDatasetId);

    // Click on the column header to sort
    const files = await screen.findByText('Size');
    expect(files).toBeTruthy();
    await user.click(files);
  });
});
