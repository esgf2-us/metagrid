/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import React from 'react';
import userEvent from '@testing-library/user-event';
import { cleanup, waitFor, within } from '@testing-library/react';
import { customRender } from '../../test/custom-render';
import DatasetDownloadForm from './DatasetDownload';
import { rest, server } from '../../api/mock/server';
import { getSearchFromUrl } from '../../common/utils';
import { ActiveSearchQuery } from '../Search/types';
import {
  getRowName,
  mockFunction,
  printElementContents,
  tempStorageGetMock,
  tempStorageSetMock,
} from '../../test/jestTestFunctions';
import App from '../App/App';
import { GlobusTokenResponse } from './types';
import GlobusStateKeys from './recoil/atom';
import CartStateKeys from '../Cart/recoil/atoms';
import { globusEndpointFixture } from '../../api/mock/fixtures';
import apiRoutes from '../../api/routes';
import * as enviroConfig from '../../env';

// For mocking environment variables
// https://www.mikeborozdin.com/post/changing-jest-mocks-between-tests
const mockConfig = enviroConfig as { globusEnabledNodes: string[] };
const originalEnabledNodes = [
  'aims3.llnl.gov',
  'esgf-data1.llnl.gov',
  'esgf-data2.llnl.gov',
];

// Used to restore window.location after each test
const location = JSON.stringify(window.location);

const activeSearch: ActiveSearchQuery = getSearchFromUrl('project=test1');

const user = userEvent.setup();

const mockLoadValue = mockFunction((key: string) => {
  return Promise.resolve(tempStorageGetMock(key));
});

const mockSaveValue = mockFunction((key: string, value: unknown) => {
  tempStorageSetMock(key, value);
  return Promise.resolve({
    msg: 'Updated temporary storage.',
    data_key: key,
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

// Mock the globusEnabledNodes variable to simulate none configured
jest.mock('../../env', () => {
  const originalModule = jest.requireActual('../../env');

  return {
    __esModule: true,
    ...originalModule,
    globusEnabledNodes: originalEnabledNodes,
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
  window.location.replace = () => {}; // Don't do anything with redirects

  // Clear localStorage between tests
  localStorage.clear();

  // Reset all mocks after each test
  jest.clearAllMocks();

  // Reset the environment variables that may have been set in tests
  mockConfig.globusEnabledNodes = originalEnabledNodes;

  server.resetHandlers();

  cleanup();
});

beforeEach(() => {
  // Set default values for recoil atoms
  tempStorageSetMock(GlobusStateKeys.defaultEndpoint, null);
  tempStorageSetMock(GlobusStateKeys.useDefaultEndpoint, false);
  tempStorageSetMock(GlobusStateKeys.globusTaskItems, []);
  tempStorageSetMock(CartStateKeys.cartDownloadIsLoading, false);
  tempStorageSetMock(CartStateKeys.cartDownloadIsLoading, []);
});

describe('DatasetDownload form tests', () => {
  it('Download form renders.', () => {
    const downloadForm = customRender(<DatasetDownloadForm />);
    expect(downloadForm).toBeTruthy();
  });

  it('Start the wget transfer after adding an item to cart', async () => {
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

    // Expect download success message to show
    await waitFor(() =>
      expect(
        getByText('Wget script downloaded successfully!', { exact: false })
      ).toBeTruthy()
    );
  });

  it("Alert popup doesn't show if no globus enabled nodes are configured.", async () => {
    mockConfig.globusEnabledNodes = [];

    const {
      getByTestId,
      getByRole,
      getByText,
      getAllByRole,
      getAllByText,
    } = customRender(<App searchQuery={activeSearch} />);

    // Wait for results to load
    await waitFor(() =>
      expect(getByText('results found for', { exact: false })).toBeTruthy()
    );

    // Check second row renders and click the checkbox
    const secondRow = getByRole('row', {
      name: getRowName('plus', 'close', 'bar', '2', '1', '1'),
    });

    // Check row has add button and click it
    const addBtn = within(secondRow).getByRole('img', { name: 'plus' });
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

    // Select item for globus transfer even though its not globus enabled
    const secondCheckBox = getAllByRole('checkbox')[0];
    expect(secondCheckBox).toBeTruthy();
    await user.click(secondCheckBox);

    // Click Transfer button
    const globusTransferBtn = getByRole('button', {
      name: /download transfer/i,
    });
    expect(globusTransferBtn).toBeTruthy();
    await user.click(globusTransferBtn);

    // Expect the transfer popup to show
    const globusTransferPopup = getByText(/Steps for Globus transfer:/i);
    expect(globusTransferPopup).toBeTruthy();
  });

  it('Alert popup indicates a dataset is not globus enabled.', async () => {
    const {
      getByTestId,
      getByRole,
      getByText,
      getAllByRole,
      getAllByText,
    } = customRender(<App searchQuery={activeSearch} />);

    // Wait for results to load
    await waitFor(() =>
      expect(getByText('results found for', { exact: false })).toBeTruthy()
    );

    // Check first row renders and click the checkbox
    const firstRow = getByRole('row', {
      name: getRowName('plus', 'check', 'foo', '3', '1', '1', true),
    });

    // Check row has add button and click it
    const addBtn = within(firstRow).getByRole('img', { name: 'plus' });
    expect(addBtn).toBeTruthy();
    await user.click(addBtn);

    const secondRow = getByRole('row', {
      name: getRowName('plus', 'close', 'bar', '2', '1', '1', false),
    });

    const secondBtn = within(secondRow).getByRole('img', { name: 'plus' });
    expect(secondBtn).toBeTruthy();
    await user.click(secondBtn);

    const thirdRow = getByRole('row', {
      name: getRowName('plus', 'question', 'foobar', '3', '1', '1', false),
    });

    const thirdBtn = within(thirdRow).getByRole('img', { name: 'plus' });
    expect(thirdBtn).toBeTruthy();
    await user.click(thirdBtn);

    // Check 'Added items(s) to the cart' message appears
    const addText = await waitFor(
      () => getAllByText('Added item(s) to your cart')[0]
    );
    expect(addText).toBeTruthy();

    // Switch to the cart page
    const cartBtn = getByTestId('cartPageLink');
    await user.click(cartBtn);

    // Select all items for globus transfer
    const firstCheckBox = getAllByRole('checkbox')[0];
    expect(firstCheckBox).toBeTruthy();
    await user.click(firstCheckBox);
    const secondCheckBox = getAllByRole('checkbox')[1];
    expect(secondCheckBox).toBeTruthy();
    await user.click(secondCheckBox);
    const thirdCheckBox = getAllByRole('checkbox')[2];
    expect(thirdCheckBox).toBeTruthy();
    await user.click(thirdCheckBox);

    // Click Transfer button
    const globusTransferBtn = getByRole('button', {
      name: /download transfer/i,
    });
    expect(globusTransferBtn).toBeTruthy();
    await user.click(globusTransferBtn);

    // Expect the steps popup to show with below message
    const warningPopup1 = getByText(
      /Some of your selected items cannot be transfered via Globus./i
    );
    expect(warningPopup1).toBeTruthy();

    // Select cancel to cancel the transfer (leaving selections alone)
    await user.click(getByText('Cancel'));

    // Deselect the 3rd dataset
    await user.click(thirdCheckBox);

    // Start transfer again
    await user.click(globusTransferBtn);

    // Expect the steps popup to show with a different message
    const warningPopup2 = getByText(
      /One of your selected items cannot be transfered via Globus./i
    );
    expect(warningPopup2).toBeTruthy();
    await user.click(getByText('Cancel'));

    // Deselect the globus enabled dataset
    await user.click(firstCheckBox);

    // Start transfer again
    await user.click(globusTransferBtn);

    // Expect the steps popup to show with a different message
    const warningPopup3 = getByText(
      /None of your selected items can be transferred via Globus at this time./i
    );
    expect(warningPopup3).toBeTruthy();

    await user.click(getByText('Ok'));

    // Test that transfer is started with only enabled datasets

    // Re-select the globus enabled dataset
    await user.click(firstCheckBox);

    // Start transfer again
    await user.click(globusTransferBtn);

    // Check that the non-globus ready option is currently selected
    expect(secondCheckBox).toBeChecked();

    // Click OK at the popup to proceed with globus transfer
    await user.click(getByText('Ok'));

    // Check that the non-globus ready option was deselected
    expect(secondCheckBox).not.toBeChecked();
  });

  it('Download form renders and transfer popup form shows after clicking Transfer.', async () => {
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

    // Expect the transfer popup to show
    const globusTransferPopup = getByText(/Steps for Globus transfer:/i);
    expect(globusTransferPopup).toBeTruthy();
  });

  it('Clicking cancel hides the transfer popup', async () => {
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

    // Get the transfer dialog popup component
    const popupModal = getByRole('dialog');
    expect(popupModal).toBeTruthy();

    // The dialog should be visible
    expect(popupModal).toBeVisible();

    // Click Cancel to end transfer steps
    const cancelBtn = getByText('Cancel');
    expect(cancelBtn).toBeTruthy();
    await user.click(cancelBtn);

    // Expect the dialog to not be visible
    expect(popupModal).not.toBeVisible();
  });

  it('Globus Transfer popup will show sign-in as first step when no tokens detected', async () => {
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

    // Get the transfer dialog popup component
    const popupModal = getByRole('dialog');
    expect(popupModal).toBeTruthy();

    // The dialog should be visible
    expect(popupModal).toBeVisible();

    // Select the sign-in step in the dialog
    const signInStep = within(popupModal).getByText(
      'Redirect to obtain transfer permission from Globus',
      {
        exact: false,
      }
    );
    // It should have a -> symbol next to it to indicate it's the next step
    expect(signInStep.innerHTML).toMatch(
      '-&gt; Redirect to obtain transfer permission from Globus.'
    );

    // Click Yes to start transfer steps
    const yesBtn = getByText('Yes');
    expect(yesBtn).toBeTruthy();
    await user.click(yesBtn);

    // Expect the dialog to not be visible
    expect(popupModal).not.toBeVisible();
  });

  it('Globus Transfer popup will show sign-in as first step when transfer token is expired', async () => {
    // Setting the tokens so that the sign-in step should be skipped
    mockSaveValue(CartStateKeys.cartItemSelections, []);
    mockSaveValue(GlobusStateKeys.refreshToken, 'refreshToken');
    mockSaveValue(GlobusStateKeys.transferToken, {
      id_token: '',
      resource_server: '',
      other_tokens: { refresh_token: 'something', transfer_token: 'something' },
      created_on: 1,
      expires_in: 100,
      access_token: '',
      refresh_expires_in: 0,
      refresh_token: 'something',
      scope:
        'openid profile email offline_access urn:globus:auth:scope:transfer.api.globus.org:all',
      token_type: '',
    } as GlobusTokenResponse);
    mockSaveValue(GlobusStateKeys.continueGlobusPrepSteps, true);

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

    // Get the transfer dialog popup component
    const popupModal = getByRole('dialog');
    expect(popupModal).toBeTruthy();

    // The dialog should be visible
    expect(popupModal).toBeVisible();

    // Select the sign-in step in the dialog
    const signInStep = within(popupModal).getByText(
      'Redirect to obtain transfer permission from Globus',
      {
        exact: false,
      }
    );
    // It should have a -> symbol next to it to indicate it's the next step
    expect(signInStep.innerHTML).toMatch(
      '-&gt; Redirect to obtain transfer permission from Globus.'
    );

    // Click Yes to start transfer steps
    const yesBtn = getByText('Yes');
    expect(yesBtn).toBeTruthy();
    await user.click(yesBtn);

    // Expect the dialog to not be visible
    expect(popupModal).not.toBeVisible();
  });

  it('Globus Transfer popup will show sign-in as first step when missing refresh token', async () => {
    // Setting the tokens so that the sign-in step should be skipped
    mockSaveValue(CartStateKeys.cartItemSelections, []);
    mockSaveValue(GlobusStateKeys.transferToken, {
      id_token: '',
      resource_server: '',
      other_tokens: { refresh_token: 'something', transfer_token: 'something' },
      created_on: Math.floor(Date.now() / 1000),
      expires_in: Math.floor(Date.now() / 1000) + 100,
      access_token: '',
      refresh_expires_in: 0,
      refresh_token: 'something',
      scope:
        'openid profile email offline_access urn:globus:auth:scope:transfer.api.globus.org:all',
      token_type: '',
    } as GlobusTokenResponse);
    mockSaveValue(GlobusStateKeys.continueGlobusPrepSteps, true);

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

    // Get the transfer dialog popup component
    const popupModal = getByRole('dialog');
    expect(popupModal).toBeTruthy();

    // The dialog should be visible
    expect(popupModal).toBeVisible();

    // Select the sign-in step in the dialog
    const signInStep = within(popupModal).getByText(
      'Redirect to obtain transfer permission from Globus',
      {
        exact: false,
      }
    );
    // It should have a -> symbol next to it to indicate it's the next step
    expect(signInStep.innerHTML).toMatch(
      '-&gt; Redirect to obtain transfer permission from Globus.'
    );

    // Click Yes to start transfer steps
    const yesBtn = getByText('Yes');
    expect(yesBtn).toBeTruthy();
    await user.click(yesBtn);

    // Expect the dialog to not be visible
    expect(popupModal).not.toBeVisible();
  });

  it('Globus Transfer steps start at select endpoint when refresh and transfer tokens are available', async () => {
    // Setting the tokens so that the sign-in step should be skipped
    mockSaveValue(CartStateKeys.cartItemSelections, []);
    mockSaveValue(GlobusStateKeys.refreshToken, 'refreshToken');
    mockSaveValue(GlobusStateKeys.transferToken, {
      id_token: '',
      resource_server: '',
      other_tokens: { refresh_token: 'something', transfer_token: 'something' },
      created_on: Math.floor(Date.now() / 1000),
      expires_in: Math.floor(Date.now() / 1000) + 100,
      access_token: '',
      refresh_expires_in: 0,
      refresh_token: 'something',
      scope:
        'openid profile email offline_access urn:globus:auth:scope:transfer.api.globus.org:all',
      token_type: '',
    } as GlobusTokenResponse);
    mockSaveValue(GlobusStateKeys.continueGlobusPrepSteps, true);

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

    // Get the transfer dialog popup component
    const popupModal = getByRole('dialog');
    expect(popupModal).toBeTruthy();

    // The dialog should be visible
    expect(popupModal).toBeVisible();

    // Select the endpoint step in the dialog
    const selectEndpointStep = within(
      popupModal
    ).getByText('Redirect to select an endpoint in Globus', { exact: false });
    // It should have a -> symbol next to it to indicate it's the next step
    expect(selectEndpointStep.innerHTML).toMatch(
      '-&gt; Redirect to select an endpoint in Globus.'
    );

    // Click Yes to start transfer steps
    const yesBtn = getByText('Yes');
    expect(yesBtn).toBeTruthy();
    await user.click(yesBtn);

    // Expect the dialog to not be visible
    expect(popupModal).not.toBeVisible();
  });

  it('Globus Transfer steps popup has endpoint check if endpoint available', async () => {
    // Setting the tokens so that the endpoint step should be completed
    mockSaveValue(GlobusStateKeys.useDefaultEndpoint, false);
    mockSaveValue(GlobusStateKeys.defaultEndpoint, null);
    mockSaveValue(
      GlobusStateKeys.userSelectedEndpoint,
      globusEndpointFixture()
    );

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

    // Get the transfer dialog popup component
    const popupModal = getByRole('dialog');
    expect(popupModal).toBeTruthy();

    // The dialog should be visible
    expect(popupModal).toBeVisible();

    // Select the endpoint step in the dialog
    const selectEndpointStep = within(
      popupModal
    ).getByText('Redirect to select an endpoint in Globus', { exact: false });
    // It should have a check-circle next to it to indicate it's completed
    expect(selectEndpointStep.innerHTML).toMatch(
      /Redirect to select an endpoint in Globus.<span role="img" aria-label="check-circle"/i
    );

    // Click Yes to start transfer steps
    const yesBtn = getByText('Yes');
    expect(yesBtn).toBeTruthy();
    await user.click(yesBtn);

    // Expect the dialog to not be visible
    expect(popupModal).not.toBeVisible();
  });
});

describe('DatasetDownload form test failures', () => {
  it('Wget transfer fails and failure message pops up.', async () => {
    server.use(
      rest.post(apiRoutes.wget.path, (_req, res, ctx) => res(ctx.status(404)))
    );

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

    // Expect error message to show
    await waitFor(() =>
      expect(
        getAllByText(
          'The requested resource at the ESGF wget API service was invalid.',
          { exact: false }
        )
      ).toBeTruthy()
    );
  });
});
