/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import React from 'react';
import userEvent from '@testing-library/user-event';
import { cleanup, waitFor, within } from '@testing-library/react';
import { customRender } from '../../test/custom-render';
import DatasetDownloadForm from './DatasetDownload';
import { server } from '../../api/mock/server';
import { getSearchFromUrl } from '../../common/utils';
import { ActiveSearchQuery } from '../Search/types';
import {
  getRowName,
  printElementContents,
  tempStorageGetMock,
  tempStorageSetMock,
} from '../../test/jestTestFunctions';
import App from '../App/App';
import { GlobusTokenResponse } from './types';

// Used to restore window.location after each test
const location = JSON.stringify(window.location);

const activeSearch: ActiveSearchQuery = getSearchFromUrl('project=test1');

const user = userEvent.setup();

const mockLoadValue = jest.fn();
mockLoadValue.mockImplementation((key: string) => {
  return Promise.resolve({
    msg: 'Key found!',
    key: tempStorageGetMock(key),
  });
});

const mockSaveValue = jest.fn();
mockSaveValue.mockImplementation((key: string, value: unknown) => {
  return Promise.resolve({
    msg: 'Updated temporary storage.',
    data_key: tempStorageSetMock(key, value),
  });
});

jest.mock('../../api/index', () => {
  const originalModule = jest.requireActual('../../api/index');

  return {
    __esModule: true,
    ...originalModule,
    loadSessionValue: (key: string) => {
      return mockLoadValue(key);
    },
    saveSessionValue: (key: string, value: unknown) => {
      return mockSaveValue(key, value);
    },
  };
});

afterEach(() => {
  // Routes are already declared in the App component using BrowserRouter, so MemoryRouter does
  // not work to isolate routes in memory between tests. The only workaround is to delete window.location and restore it after each test in order to reset the URL location.
  // https://stackoverflow.com/a/54222110
  // https://stackoverflow.com/questions/59892304/cant-get-memoryrouter-to-work-with-testing-library-react

  // TypeScript complains with error TS2790: The operand of a 'delete' operator must be optional.
  // https://github.com/facebook/jest/issues/890#issuecomment-776112686
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  delete window.location;
  window.location = (JSON.parse(location) as unknown) as Location;

  // Clear localStorage between tests
  localStorage.clear();

  // Reset all mocks after each test
  jest.clearAllMocks();

  server.resetHandlers();

  cleanup();
});

describe('Download form tests', () => {
  it('Download form renders.', () => {
    const downloadForm = customRender(<DatasetDownloadForm />);
    expect(downloadForm).toBeTruthy();
  });
  it('Start the wget transfer', async () => {
    const { getByTestId, getByRole, getByText, getAllByText } = customRender(
      <App searchQuery={activeSearch} />
    );

    // Wait for results to load
    await waitFor(() =>
      expect(getByText('results found for', { exact: false })).toBeTruthy()
    );

    // Check first row renders and click the checkbox
    const firstRow = getByRole('row', {
      name: getRowName('plus', 'check', 'foo', '3', '1', '1', true),
    });

    // Check first row has add button and click it
    const addBtn = within(firstRow).getByRole('img', { name: 'plus' });
    expect(addBtn).toBeTruthy();
    await user.click(addBtn);

    // Check 'Added items(s) to the cart' message appears
    const addText = await waitFor(
      () => getAllByText('Added item(s) to your cart')[0]
    );
    expect(addText).toBeTruthy();

    // Switch to the cart page
    const cartBtn = getByTestId('cartPageLink');
    await user.click(cartBtn);

    // Select item for globus transfer
    const firstCheckBox = getByRole('checkbox');
    expect(firstCheckBox).toBeTruthy();
    await user.click(firstCheckBox);

    // Select download dropdown
    const globusTransferDropdown = getByText('Globus');
    expect(globusTransferDropdown).toBeTruthy();
    await user.click(globusTransferDropdown);

    // Select wget
    const wgetOption = getAllByText(/wget/i)[2];
    expect(wgetOption).toBeTruthy();
    await user.click(wgetOption);

    // Start wget download
    const wgetDownload = getByText('Download');
    expect(wgetDownload).toBeTruthy();
    await user.click(wgetDownload);

    // Expect script generating message to show
    expect(
      getByText('The wget script is generating, please wait momentarily.')
    ).toBeTruthy();
  });
  it('Download form renders and transfer popup form shows.', async () => {
    const { getByTestId, getByRole, getByText, getAllByText } = customRender(
      <App searchQuery={activeSearch} />
    );

    // Wait for results to load
    await waitFor(() =>
      expect(getByText('results found for', { exact: false })).toBeTruthy()
    );

    // Check first row renders and click the checkbox
    const firstRow = getByRole('row', {
      name: getRowName('plus', 'check', 'foo', '3', '1', '1', true),
    });

    // Check first row has add button and click it
    const addBtn = within(firstRow).getByRole('img', { name: 'plus' });
    expect(addBtn).toBeTruthy();
    await user.click(addBtn);

    // Check 'Added items(s) to the cart' message appears
    const addText = await waitFor(
      () => getAllByText('Added item(s) to your cart')[0]
    );
    expect(addText).toBeTruthy();

    // Switch to the cart page
    const cartBtn = getByTestId('cartPageLink');
    await user.click(cartBtn);

    // Select item for globus transfer
    const firstCheckBox = getByRole('checkbox');
    expect(firstCheckBox).toBeTruthy();
    await user.click(firstCheckBox);

    // Click Transfer button
    const globusTransferBtn = getByRole('button', {
      name: /download transfer/i,
    });
    expect(globusTransferBtn).toBeTruthy();
    await user.click(globusTransferBtn);

    // Expect the steps popup to show
    expect(getByText(/Steps for Globus transfer:/i)).toBeTruthy();
  });

  xit('Cancel Globus Transfer steps', async () => {
    const { getByTestId, getByRole, getByText, getAllByText } = customRender(
      <App searchQuery={activeSearch} />
    );

    tempStorageSetMock('globusTransferToken', {
      id_token: '',
      resource_server: '',
      other_tokens: { refresh_token: '', transfer_token: '' },
      created_on: 0,
      expires_in: 1000,
      access_token: '',
      refresh_expires_in: 0,
      refresh_token: '',
      scope:
        'openid profile email offline_access urn:globus:auth:scope:transfer.api.globus.org:all',
      token_type: '',
    } as GlobusTokenResponse);

    tempStorageGetMock('globusTransferToken');

    // Wait for results to load
    await waitFor(() =>
      expect(getByText('results found for', { exact: false })).toBeTruthy()
    );

    // Check first row renders and click the checkbox
    const firstRow = getByRole('row', {
      name: getRowName('plus', 'check', 'foo', '3', '1', '1', true),
    });

    // Check first row has add button and click it
    const addBtn = within(firstRow).getByRole('img', { name: 'plus' });
    expect(addBtn).toBeTruthy();
    await user.click(addBtn);

    // Check 'Added items(s) to the cart' message appears
    const addText = await waitFor(
      () => getAllByText('Added item(s) to your cart')[0]
    );
    expect(addText).toBeTruthy();

    // Switch to the cart page
    const cartBtn = getByTestId('cartPageLink');
    await user.click(cartBtn);

    // Select item for globus transfer
    const firstCheckBox = getByRole('checkbox');
    expect(firstCheckBox).toBeTruthy();
    await user.click(firstCheckBox);

    // Click Transfer button
    const globusTransferBtn = getByRole('button', {
      name: /download transfer/i,
    });
    expect(globusTransferBtn).toBeTruthy();
    await user.click(globusTransferBtn);

    // Click Cancel to end transfer steps
    const cancelBtn = getByText('Cancel');
    expect(cancelBtn).toBeTruthy();
    await user.click(cancelBtn);

    printElementContents(cancelBtn);
  });

  it('Cancel Globus Transfer steps', async () => {
    const { getByTestId, getByRole, getByText, getAllByText } = customRender(
      <App searchQuery={activeSearch} />
    );

    // Wait for results to load
    await waitFor(() =>
      expect(getByText('results found for', { exact: false })).toBeTruthy()
    );

    // Check first row renders and click the checkbox
    const firstRow = getByRole('row', {
      name: getRowName('plus', 'check', 'foo', '3', '1', '1', true),
    });

    // Check first row has add button and click it
    const addBtn = within(firstRow).getByRole('img', { name: 'plus' });
    expect(addBtn).toBeTruthy();
    await user.click(addBtn);

    // Check 'Added items(s) to the cart' message appears
    const addText = await waitFor(
      () => getAllByText('Added item(s) to your cart')[0]
    );
    expect(addText).toBeTruthy();

    // Switch to the cart page
    const cartBtn = getByTestId('cartPageLink');
    await user.click(cartBtn);

    // Select item for globus transfer
    const firstCheckBox = getByRole('checkbox');
    expect(firstCheckBox).toBeTruthy();
    await user.click(firstCheckBox);

    // Click Transfer button
    const globusTransferBtn = getByRole('button', {
      name: /download transfer/i,
    });
    expect(globusTransferBtn).toBeTruthy();
    await user.click(globusTransferBtn);

    // Click Yes to start transfer steps
    // const yesBtn = getByText('Yes');
    // expect(yesBtn).toBeTruthy();
    // await user.click(yesBtn);

    // printElementContents(undefined);
  });
});
