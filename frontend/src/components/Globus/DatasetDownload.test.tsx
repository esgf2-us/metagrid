import React from 'react';
import userEvent from '@testing-library/user-event';
import { waitFor, within } from '@testing-library/react';
import customRender from '../../test/custom-render';
import { rest, server } from '../../api/mock/server';
import { getSearchFromUrl } from '../../common/utils';
import { ActiveSearchQuery } from '../Search/types';
import {
  getRowName,
  mockConfig,
  mockFunction,
  openDropdownList,
  tempStorageGetMock,
  tempStorageSetMock,
} from '../../test/jestTestFunctions';
import App from '../App/App';
import { GlobusTokenResponse } from './types';
import GlobusStateKeys from './recoil/atom';
import CartStateKeys from '../Cart/recoil/atoms';
import {
  globusEndpointFixture,
  globusRefeshTokenFixture,
  globusTransferTokenFixture,
  userCartFixture,
} from '../../api/mock/fixtures';
import apiRoutes from '../../api/routes';
import DatasetDownloadForm from './DatasetDownload';

const activeSearch: ActiveSearchQuery = getSearchFromUrl('project=test1');

const user = userEvent.setup();

const mockLoadValue = mockFunction((key: unknown) => {
  return Promise.resolve(tempStorageGetMock(key as string));
});

const mockSaveValue = mockFunction((key: unknown, value: unknown) => {
  tempStorageSetMock(key as string, value);
  return Promise.resolve({
    msg: 'Updated temporary storage.',
    data_key: key,
  });
});

jest.mock('../../api/index', () => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const originalModule = jest.requireActual('../../api/index');

  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
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

beforeEach(() => {
  // Set default values for recoil atoms
  tempStorageSetMock(GlobusStateKeys.defaultEndpoint, null);
  tempStorageSetMock(GlobusStateKeys.useDefaultEndpoint, false);
  tempStorageSetMock(GlobusStateKeys.globusTaskItems, []);
  tempStorageSetMock(CartStateKeys.cartItemSelections, []);
  tempStorageSetMock(CartStateKeys.cartDownloadIsLoading, false);
});

xdescribe('DatasetDownload form tests', () => {
  it('Download form renders.', async () => {
    const downloadForm = customRender(<DatasetDownloadForm />);
    expect(downloadForm).toBeTruthy();

    await downloadForm.findByTestId('downloadTypeSelector');
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

    // Open download dropdown
    const globusTransferDropdown = within(
      getByTestId('downloadTypeSelector')
    ).getByRole('combobox');

    await openDropdownList(user, globusTransferDropdown);

    // Select wget
    const wgetOption = getAllByText(/wget/i)[2];
    expect(wgetOption).toBeTruthy();
    await user.click(wgetOption);

    // Start wget download
    const downloadBtn = getByText('Download');
    expect(downloadBtn).toBeTruthy();
    await user.click(downloadBtn);

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

    // Set the tokens in the url
    Object.defineProperty(window, 'location', {
      value: {
        assign: () => {},
        pathname: '/cart/items',
        href: 'https://localhost:3000?blah=blah&foo=bar',
        search: '?blah=blah&foo=bar',
        replace: () => {},
      },
    });

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

  it('Collects url tokens for globus transfer steps', async () => {
    // Setting the tokens so that the sign-in step should be skipped
    mockSaveValue(CartStateKeys.cartItemSelections, userCartFixture());
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

    // Set the tokens in the url
    Object.defineProperty(window, 'location', {
      value: {
        assign: () => {},
        pathname: '/cart/items',
        href:
          'https://localhost:3000/cart/items?code=12kj3kjh4&state=testingTransferTokens',
        search: '?code=12kj3kjh4&state=testingTransferTokens',
        replace: () => {},
      },
    });

    tempStorageSetMock('pkce-pass', true);

    // Switch to the cart page
    const cartBtn = getByTestId('cartPageLink');
    await user.click(cartBtn);

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

    // Check that a non-null tokens were received
    const refreshToken = await mockLoadValue(GlobusStateKeys.refreshToken);
    const transferToken = (await mockLoadValue(
      GlobusStateKeys.transferToken
    )) as GlobusTokenResponse;
    if (transferToken && transferToken.created_on) {
      transferToken.created_on = 0; // Resets the token's time for comparison equality
    }
    expect(refreshToken).toEqual(globusRefeshTokenFixture);
    expect(transferToken).toEqual(globusTransferTokenFixture);

    tempStorageSetMock('pkce-pass', undefined);
  });

  it('Globus Transfer steps popup has endpoint checked if endpoint available', async () => {
    // Setting the tokens so that the endpoint step is completed
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

  it('If endpoint URL is available, process it and continue with sign-in', async () => {
    // Setting the tokens so that the sign-in step should be completed
    mockSaveValue(CartStateKeys.cartItemSelections, userCartFixture());
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

    // Set endpoint in url
    Object.defineProperty(window, 'location', {
      value: {
        assign: () => {},
        pathname: '/cart/items',
        href:
          'https://localhost:3000/cart/items?endpoint=dummyEndpoint&label=dummy&path=nowhere&globfs=empty&endpointid=endpoint1',
        search:
          '?endpoint=dummyEndpoint&label=dummy&path=nowhere&globfs=empty&endpointid=endpoint1',
        replace: () => {},
      },
    });

    // Switch to the cart page
    const cartBtn = getByTestId('cartPageLink');
    await user.click(cartBtn);

    // A popup should come asking if user wishes to save endpoint as default
    const saveEndpointDialog = getByRole('dialog');
    expect(saveEndpointDialog).toBeTruthy();
    expect(saveEndpointDialog).toBeVisible();
    expect(saveEndpointDialog).toHaveTextContent(
      'Do you want to save this endpoint as default?'
    );

    // Click Yes to save the endpoint as default
    const yesBtn = within(saveEndpointDialog).getByText('Yes');
    expect(yesBtn).toBeTruthy();
    await user.click(yesBtn);

    // Next step should be to start the Transfer
    const globusTransferDialog = getByRole('dialog');
    expect(globusTransferDialog).toBeTruthy();

    // Select the final transfer step in the dialog
    const transferStep = within(globusTransferDialog).getByText(
      'Redirect to obtain transfer permission from Globus',
      {
        exact: false,
      }
    );
    // The transfer step should be the next step to perform
    expect(transferStep.innerHTML).toMatch(
      /-&gt; Redirect to obtain transfer permission from Globus./i
    );
  });

  it('If endpoint URL is available, process it and continue to Transfer process', async () => {
    // Setting the tokens so that the sign-in step should be completed
    mockSaveValue(CartStateKeys.cartItemSelections, userCartFixture());
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

    // Set endpoint in url
    Object.defineProperty(window, 'location', {
      value: {
        assign: () => {},
        pathname: '/cart/items',
        href:
          'https://localhost:3000/cart/items?endpoint=dummyEndpoint&label=dummy&path=nowhere&globfs=empty&endpointid=endpoint1',
        search:
          '?endpoint=dummyEndpoint&label=dummy&path=nowhere&globfs=empty&endpointid=endpoint1',
        replace: () => {},
      },
    });

    // Switch to the cart page
    const cartBtn = getByTestId('cartPageLink');
    await user.click(cartBtn);

    // A popup should come asking if user wishes to save endpoint as default
    const saveEndpointDialog = getByRole('dialog');
    expect(saveEndpointDialog).toBeTruthy();
    expect(saveEndpointDialog).toBeVisible();
    expect(saveEndpointDialog).toHaveTextContent(
      'Do you want to save this endpoint as default?'
    );

    // Click Yes to save the endpoint as default
    const yesBtn = within(saveEndpointDialog).getByText('Yes');
    expect(yesBtn).toBeTruthy();
    await user.click(yesBtn);

    // Next step should be to start the Transfer
    const globusTransferDialog = getByRole('dialog');
    expect(globusTransferDialog).toBeTruthy();

    // Select the final transfer step in the dialog
    const transferStep = within(globusTransferDialog).getByText(
      'Start Globus transfer.',
      {
        exact: false,
      }
    );
    // The transfer step should be the next step to perform
    expect(transferStep.innerHTML).toMatch(/-&gt; {2}Start Globus transfer./i);

    // Click Yes to continue transfer steps
    const startBtn = within(globusTransferDialog).getByText('Yes');
    expect(startBtn).toBeTruthy();
    await user.click(startBtn);

    // Check 'Globus transfer task submitted successfully!' message appears
    const taskMsg = await waitFor(() =>
      getByText('Globus transfer task submitted successfully!', {
        exact: false,
      })
    );
    expect(taskMsg).toBeTruthy();

    // Clear all task items
    const submitHistory = getByText('Task Submit History', { exact: false });
    expect(submitHistory).toBeTruthy();
    const clearAllBtn = within(submitHistory).getByText('Clear All');
    expect(clearAllBtn).toBeTruthy();
    await user.click(clearAllBtn);
  });

  it('If endpoint URL is set, and sign in tokens in URL, continue to select endpoint', async () => {
    // Setting the tokens so that the sign-in step should be completed
    mockSaveValue(
      GlobusStateKeys.userSelectedEndpoint,
      globusEndpointFixture()
    );
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

    // Select the endpoint step in the dialog
    const selectEndpointStep = within(
      popupModal
    ).getByText('Redirect to select an endpoint in Globus', { exact: false });
    // It should NOT have a -> symbol next to it to indicate it's the next step
    expect(selectEndpointStep.innerHTML).toMatch(
      'Redirect to select an endpoint in Globus.'
    );

    // Click Yes to start next transfer steps
    const yesBtn = getByText('Yes');
    expect(yesBtn).toBeTruthy();
    await user.click(yesBtn);

    // Expect the dialog to not be visible
    expect(popupModal).not.toBeVisible();
  });

  it('Perform Transfer process when sign in tokens and endpoint are BOTH ready', async () => {
    // Setting the tokens so that the sign-in step should be completed
    mockSaveValue(CartStateKeys.cartItemSelections, userCartFixture());
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
    mockSaveValue(
      GlobusStateKeys.userSelectedEndpoint,
      globusEndpointFixture()
    );
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

    // Check 'Globus transfer task submitted successfully!' message appears
    const taskMsg = await waitFor(() =>
      getByText('Globus transfer task submitted successfully!', {
        exact: false,
      })
    );
    expect(taskMsg).toBeTruthy();

    // Clear all task items
    const submitHistory = getByText('Task Submit History', { exact: false });
    expect(submitHistory).toBeTruthy();
    const clearAllBtn = within(submitHistory).getByText('Clear All');
    expect(clearAllBtn).toBeTruthy();
    await user.click(clearAllBtn);
  });

  it('Perform Transfer will pop a task if max tasks was reached, to keep 10 tasks at most', async () => {
    // Setting the tokens so that the sign-in step should be completed
    mockSaveValue(CartStateKeys.cartItemSelections, userCartFixture());
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
    mockSaveValue(GlobusStateKeys.defaultEndpoint, globusEndpointFixture());
    mockSaveValue(GlobusStateKeys.globusTaskItems, [
      {
        submitDate: '11/30/2023, 3:10:00 PM',
        taskId: '0123456',
        taskStatusURL: 'https://app.globus.org/activity/0123456/overview',
      },
      {
        submitDate: '11/30/2023, 3:15:00 PM',
        taskId: '2345678',
        taskStatusURL: 'https://app.globus.org/activity/2345678/overview',
      },
      {
        submitDate: '11/30/2023, 3:20:00 PM',
        taskId: '3456789',
        taskStatusURL: 'https://app.globus.org/activity/3456789/overview',
      },
      {
        submitDate: '11/30/2023, 3:25:00 PM',
        taskId: '4567891',
        taskStatusURL: 'https://app.globus.org/activity/4567891/overview',
      },
      {
        submitDate: '11/30/2023, 3:30:00 PM',
        taskId: '5678910',
        taskStatusURL: 'https://app.globus.org/activity/5678910/overview',
      },
      {
        submitDate: '11/30/2023, 3:35:00 PM',
        taskId: '6789101',
        taskStatusURL: 'https://app.globus.org/activity/6789101/overview',
      },
      {
        submitDate: '11/30/2023, 3:40:00 PM',
        taskId: '7891011',
        taskStatusURL: 'https://app.globus.org/activity/7891011/overview',
      },
      {
        submitDate: '11/30/2023, 3:45:00 PM',
        taskId: '8910111',
        taskStatusURL: 'https://app.globus.org/activity/8910111/overview',
      },
      {
        submitDate: '11/30/2023, 3:50:00 PM',
        taskId: '9101112',
        taskStatusURL: 'https://app.globus.org/activity/9101112/overview',
      },
      {
        submitDate: '11/30/2023, 3:55:00 PM',
        taskId: '1011121',
        taskStatusURL: 'https://app.globus.org/activity/1011121/overview',
      },
    ]);
    mockSaveValue(GlobusStateKeys.continueGlobusPrepSteps, false);

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

    // Expand submit history
    const submitHistory = getByText('Task Submit History', { exact: false });
    expect(submitHistory).toBeTruthy();
    await user.click(submitHistory);

    // There should be 10 tasks in task history
    const taskItems = getAllByText('Submitted: ', { exact: false });
    expect(taskItems).toHaveLength(10);

    // Select using default endpoint
    const useDefaultOption = getByText('Default Endpoint');
    expect(useDefaultOption).toBeTruthy();
    await user.click(useDefaultOption);

    // Click Transfer button
    const globusTransferBtn = getByRole('button', {
      name: /download transfer/i,
    });
    expect(globusTransferBtn).toBeTruthy();
    await user.click(globusTransferBtn);

    // Expect warning prompt to say non globus items were selected
    const warningPopup = getByText(
      /Some of your selected items cannot be transfered via Globus./i
    );
    expect(warningPopup).toBeTruthy();

    // Select yes, to continue transfer
    const okBtn = getByText('Ok');
    await user.click(okBtn);

    // Check 'Globus transfer task submitted successfully!' message appears
    const taskMsg = await waitFor(
      () =>
        getAllByText('Globus transfer task submitted successfully!', {
          exact: false,
        })[0]
    );
    expect(taskMsg).toBeTruthy();

    // There should still only be 10 tasks in task history
    const taskItemsNow = getAllByText('Submitted: ', { exact: false });
    expect(taskItemsNow).toHaveLength(10);

    // The last task should have been popped, and first should be 2nd
    expect(taskItemsNow[1].innerHTML).toEqual(
      'Submitted: 11/30/2023, 3:10:00 PM'
    );
  });
});

xdescribe('Testing globus transfer related failures', () => {
  beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation(jest.fn());
    tempStorageSetMock('pkce-pass', false);
    jest.resetModules();
  });

  it('Shows an error message if transfer task fails', async () => {
    server.use(
      rest.post(apiRoutes.globusTransfer.path, (_req, res, ctx) =>
        res(ctx.status(404))
      )
    );

    // Setting the tokens so that the sign-in step should be completed
    mockSaveValue(CartStateKeys.cartItemSelections, userCartFixture());
    mockSaveValue(GlobusStateKeys.accessToken, 'globusAccessToken');
    mockSaveValue(GlobusStateKeys.transferToken, {
      id_token: '',
      resource_server: '',
      other_tokens: { refresh_token: 'something', transfer_token: 'something' },
      created_on: Math.floor(Date.now() / 1000),
      expires_in: Math.floor(Date.now() / 1000) + 100,
      access_token: '',
      refresh_expires_in: 0,
      refresh_token: 'something',
      scope: 'openid profile email offline_access ',
      token_type: '',
    } as GlobusTokenResponse);
    mockSaveValue(
      GlobusStateKeys.userSelectedEndpoint,
      globusEndpointFixture()
    );
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

    // Check 'Globus transfer task failed' message appears
    const taskMsg = await waitFor(() =>
      getByText('Globus transfer task failed', {
        exact: false,
      })
    );
    expect(taskMsg).toBeTruthy();
  });

  // TODO: Figure a reliable way to mock the GlobusAuth.exchangeForAccessToken output values.
  /** Until that is done, this test will fail and will need to use istanbul ignore statements
   * for the mean time.
   */
  xit('Shows error message if url tokens are not valid for transfer', async () => {
    // Setting the tokens so that the sign-in step should be skipped
    mockSaveValue(CartStateKeys.cartItemSelections, userCartFixture());
    mockSaveValue(GlobusStateKeys.continueGlobusPrepSteps, true);

    tempStorageSetMock('pkce-pass', false);

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

    // Set the tokens in the url
    Object.defineProperty(window, 'location', {
      value: {
        assign: () => {},
        pathname: '/cart/items',
        href:
          'https://localhost:3000/cart/items?code=12kj3kjh4&state=testingTransferTokens',
        search: '?code=12kj3kjh4&state=testingTransferTokens',
        replace: () => {},
      },
    });

    tempStorageSetMock('pkce-pass', false);

    // Switch to the cart page
    const cartBtn = getByTestId('cartPageLink');
    await user.click(cartBtn);

    const accessToken = await mockLoadValue(GlobusStateKeys.accessToken);
    const transferToken = await mockLoadValue(GlobusStateKeys.transferToken);

    expect(accessToken).toBeFalsy();
    expect(transferToken).toBeFalsy();

    // Check 'Error occurred when obtaining transfer permission!' message appears
    const taskMsg = await waitFor(
      () =>
        getAllByText('Error occured when obtaining transfer permissions.', {
          exact: false,
        })[0]
    );
    expect(taskMsg).toBeTruthy();
  });
});

xdescribe('Testing wget transfer related failures', () => {
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

    // Open download dropdown
    const globusTransferDropdown = within(
      getByTestId('downloadTypeSelector')
    ).getByRole('combobox');

    await openDropdownList(user, globusTransferDropdown);

    // Select wget
    const wgetOption = getAllByText(/wget/i)[2];
    expect(wgetOption).toBeTruthy();
    await user.click(wgetOption);

    // Start wget download
    const downloadBtn = getByText('Download');
    expect(downloadBtn).toBeTruthy();
    await user.click(downloadBtn);

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
