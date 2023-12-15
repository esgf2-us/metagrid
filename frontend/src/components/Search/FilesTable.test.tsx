import { fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import {
  ESGFSearchAPIFixture,
  rawSearchResultFixture,
} from '../../api/mock/fixtures';
import { rest, server } from '../../api/mock/server';
import apiRoutes from '../../api/routes';
import FilesTable, { DownloadUrls, genDownloadUrls, Props } from './FilesTable';
import { RawSearchResult } from './types';
import { customRenderKeycloak } from '../../test/custom-render';

const user = userEvent.setup();

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
    const { getByRole } = customRenderKeycloak(
      <FilesTable {...defaultProps} numResults={undefined} />
    );

    const component = await waitFor(() => getByRole('table'));
    expect(component).toBeTruthy();
  });

  it('returns Alert when there is an error fetching files', async () => {
    server.use(
      rest.get(apiRoutes.esgfSearch.path, (_req, res, ctx) =>
        res(ctx.status(404))
      )
    );

    const { getByRole } = customRenderKeycloak(
      <FilesTable {...defaultProps} />
    );
    const alertMsg = await waitFor(() =>
      getByRole('img', { name: 'close-circle', hidden: true })
    );
    expect(alertMsg).toBeTruthy();
  });

  it('handles downloading data with httpserver', async () => {
    const { getByTestId } = customRenderKeycloak(
      <FilesTable {...defaultProps} />
    );

    // Check component renders
    const component = await waitFor(() => getByTestId('filesTable'));
    expect(component).toBeTruthy();

    // Wait for component to re-render
    await waitFor(() => getByTestId('filesTable'));

    // Check a record row exist
    let row = await waitFor(
      () =>
        document.getElementsByClassName('ant-table-row').item(0) as HTMLElement
    );
    if (row === null) {
      row = await waitFor(
        () =>
          document
            .getElementsByClassName('ant-table-row')
            .item(0) as HTMLElement
      );
    }
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
  });

  xit('handles pagination and page size changes', async () => {
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

    const { getByRole, getByTestId, getByText } = customRenderKeycloak(
      <FilesTable {...defaultProps} numResults={numFound} />
    );

    // Check component renders
    const component = await waitFor(() => getByTestId('filesTable'));
    expect(component).toBeTruthy();

    // Wait for component to re-render
    await waitFor(() => getByTestId('filesTable'));

    // Select the combobox drop down and update its value to render options
    const paginationList = await waitFor(() => getByRole('list'));
    expect(paginationList).toBeTruthy();

    // Select the combobox drop down, update its value, then click it
    const pageSizeComboBox = await waitFor(() =>
      within(paginationList).getByRole('combobox')
    );
    expect(pageSizeComboBox).toBeTruthy();
    fireEvent.change(pageSizeComboBox, { target: { value: 'foo' } });
    await user.click(pageSizeComboBox);

    // Wait for the options to render, then select 20 / page
    const secondOption = await waitFor(() => getByText('20 / page'));
    await user.click(secondOption);

    // Change back to 10 / page
    const firstOption = await waitFor(() => getByText('10 / page'));
    await user.click(firstOption);

    // Select the 'Next Page' button (only enabled if there are > 10 results)
    const nextPage = await waitFor(() =>
      getByRole('listitem', { name: 'Next Page' })
    );
    await user.click(nextPage);

    // Wait for component to re-render
    await waitFor(() => getByTestId('filesTable'));
  });

  it('handles clicking the expandable icon', async () => {
    const { getByTestId } = customRenderKeycloak(
      <FilesTable {...defaultProps} />
    );

    // Check component renders
    const component = await waitFor(() => getByTestId('filesTable'));
    expect(component).toBeTruthy();

    // Wait for component to re-render
    await waitFor(() => getByTestId('filesTable'));

    // Check a record row exist
    let row = await waitFor(
      () =>
        document.getElementsByClassName('ant-table-row').item(0) as HTMLElement
    );

    if (row === null) {
      row = await waitFor(
        () =>
          document
            .getElementsByClassName('ant-table-row')
            .item(0) as HTMLElement
      );
    }
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
