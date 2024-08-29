import React from 'react';
import userEvent from '@testing-library/user-event';
import { act, waitFor, within, screen } from '@testing-library/react';
import customRender from '../../test/custom-render';
import { rest, server } from '../../test/mock/server';
import { getSearchFromUrl } from '../../common/utils';
import { ActiveSearchQuery } from '../Search/types';
import {
  addSearchRowsAndGoToCart,
  getRowName,
  mockConfig,
  mockFunction,
  openDropdownList,
  printElementContents,
  tempStorageGetMock,
  tempStorageSetMock,
} from '../../test/jestTestFunctions';
import App from '../App/App';
import { GlobusTokenResponse } from './types';
import GlobusStateKeys from './recoil/atom';
import CartStateKeys from '../Cart/recoil/atoms';
import {
  globusRefeshTokenFixture,
  globusTransferTokenFixture,
  userCartFixture,
} from '../../test/mock/fixtures';
import apiRoutes from '../../api/routes';
import DatasetDownloadForm from './DatasetDownload';
import { DataPersister } from '../../common/DataPersister';

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
  const dp = DataPersister.Instance;
  dp.initializeDataStore({});
  // Set default values for persistent variables
  tempStorageSetMock(GlobusStateKeys.globusTaskItems, []);
  tempStorageSetMock(CartStateKeys.cartItemSelections, []);
  tempStorageSetMock(GlobusStateKeys.savedGlobusEndpoints, []);
  tempStorageSetMock(GlobusStateKeys.userChosenEndpoint, null);
  tempStorageSetMock(CartStateKeys.cartDownloadIsLoading, false);
});

describe('DatasetDownload form tests', () => {
  it('Download form renders.', async () => {
    const downloadForm = customRender(<DatasetDownloadForm />);
    expect(downloadForm).toBeTruthy();

    await downloadForm.findByTestId('downloadTypeSelector');
    downloadForm.unmount();
  });

  it('Start the wget transfer after adding an item to cart', async () => {
    const app = customRender(<App searchQuery={activeSearch} />);

    // Wait for results to load
    const results = await waitFor(() =>
      screen.findByText('results found for', { exact: false })
    );
    expect(results).toBeTruthy();

    // Add search item to cart and switch to cart page
    await addSearchRowsAndGoToCart(user);

    // Select item for globus transfer
    const firstCheckBox = await screen.findByRole('checkbox');
    expect(firstCheckBox).toBeTruthy();
    await act(async () => {
      await user.click(firstCheckBox);
    });

    // Open download dropdown
    const globusTransferDropdown = await within(
      await screen.findByTestId('downloadTypeSelector')
    ).findByRole('combobox');

    await openDropdownList(user, globusTransferDropdown);

    // Select wget
    const wgetOption = await screen.findAllByText(/wget/i);
    expect(wgetOption[2]).toBeTruthy();
    await act(async () => {
      await user.click(wgetOption[2]);
    });

    // Start wget download
    const downloadBtn = await screen.findByTestId('downloadDatasetBtn');
    expect(downloadBtn).toBeTruthy();

    await act(async () => {
      await user.click(downloadBtn);
    });

    // Expect download success message to show
    const notice = await screen.findByText(
      'Wget script downloaded successfully!',
      {
        exact: false,
      }
    );
    expect(notice).toBeTruthy();

    app.unmount();
  });

  it("Alert popup doesn't show if no globus enabled nodes are configured.", async () => {
    mockConfig.globusEnabledNodes = [];
    const app = customRender(<App searchQuery={activeSearch} />);

    // Wait for results to load
    const results = await waitFor(() =>
      screen.findByText('results found for', { exact: false })
    );
    expect(results).toBeTruthy();

    // Check second row renders and click the checkbox
    const secondRow = await screen.findByRole('row', {
      name: getRowName('plus', 'close', 'bar', '2', '1', '1'),
    });

    // Add second cart item and switch to cart page
    await addSearchRowsAndGoToCart(user, [secondRow]);

    // Select item for globus transfer even though its not globus enabled
    const secondCheckBox = await screen.findAllByRole('checkbox');
    expect(secondCheckBox).toBeTruthy();
    await act(async () => {
      await user.click(secondCheckBox[0]);
    });

    const globusTransferBtn = await screen.findByTestId('downloadDatasetBtn');
    expect(globusTransferBtn).toBeTruthy();
    await act(async () => {
      await user.click(globusTransferBtn);
    });

    // Expect the transfer popup to show first step
    const globusTransferPopup = await screen.findByText(
      /You will be redirected to obtain globus tokens. Continue?/i
    );
    expect(globusTransferPopup).toBeTruthy();

    app.unmount();
  });

  xit('Alert popup indicates a dataset is not globus enabled.', async () => {
    const app = customRender(<App searchQuery={activeSearch} />);

    // Wait for results to load
    const results = await waitFor(() =>
      screen.findByText('results found for', { exact: false })
    );
    expect(results).toBeTruthy();

    // Check first row renders and click the checkbox
    const firstRow = await screen.findByRole('row', {
      name: getRowName('plus', 'check', 'foo', '3', '1', '1', true),
    });

    const secondRow = await screen.findByRole('row', {
      name: getRowName('plus', 'close', 'bar', '2', '1', '1', false),
    });

    const thirdRow = await screen.findByRole('row', {
      name: getRowName('plus', 'question', 'foobar', '3', '1', '1', false),
    });

    // Add first 3 rows to cart then switch to cart page
    await addSearchRowsAndGoToCart(user, [firstRow, secondRow, thirdRow]);

    // // Check row has add button and click it
    // const addBtn = within(firstRow).getByRole('img', { name: 'plus' });
    // expect(addBtn).toBeTruthy();
    // await act(async () => {
    //   await user.click(addBtn);
    // });

    // // const secondRow = await screen.findByRole('row', {
    // //   name: getRowName('plus', 'close', 'bar', '2', '1', '1', false),
    // // });
    // const secondBtn = within(secondRow).getByRole('img', { name: 'plus' });
    // expect(secondBtn).toBeTruthy();
    // await act(async () => {
    //   await user.click(secondBtn);
    // });

    // // const thirdRow = await screen.findByRole('row', {
    // //   name: getRowName('plus', 'question', 'foobar', '3', '1', '1', false),
    // // });

    // const thirdBtn = within(thirdRow).getByRole('img', { name: 'plus' });
    // expect(thirdBtn).toBeTruthy();
    // await act(async () => {
    //   await user.click(thirdBtn);
    // });

    // // Check 'Added items(s) to the cart' message appears
    // const addText = await waitFor(
    //   async () => (await screen.findAllByText('Added item(s) to your cart'))[0]
    // );
    // expect(addText).toBeTruthy();

    // // Switch to the cart page
    // const cartBtn = await screen.findByTestId('cartPageLink');
    // await act(async () => {
    //   await user.click(cartBtn);
    // });

    // Select all items for globus transfer
    const firstCheckBox = (await screen.findAllByRole('checkbox'))[0];
    expect(firstCheckBox).toBeTruthy();
    await act(async () => {
      await user.click(firstCheckBox);
    });
    // printElementContents(firstCheckBox);

    const secondCheckBox = (await screen.findAllByRole('checkbox'))[1];
    expect(secondCheckBox).toBeTruthy();
    await act(async () => {
      await user.click(secondCheckBox);
    });
    // printElementContents(secondCheckBox);

    const thirdCheckBox = (await screen.findAllByRole('checkbox'))[2];
    expect(thirdCheckBox).toBeTruthy();
    await act(async () => {
      await user.click(thirdCheckBox);
    });
    // printElementContents(thirdCheckBox);

    // Click Transfer button
    const globusTransferBtn = await screen.findByTestId('downloadDatasetBtn');
    expect(globusTransferBtn).toBeTruthy();
    await act(async () => {
      await user.click(globusTransferBtn);
    });

    // Expect the steps popup to show with below message
    const warningPopup1 = await screen.findByText(
      /Some of your selected items cannot be transferred via Globus./i,
      { exact: false }
    );
    expect(warningPopup1).toBeTruthy();

    // Select cancel to cancel the transfer (leaving selections alone)
    await act(async () => {
      await user.click(await screen.findByText('Cancel'));
    });

    // Deselect the 3rd dataset
    await act(async () => {
      await user.click(thirdCheckBox);
    });

    // Start transfer again
    await act(async () => {
      await user.click(globusTransferBtn);
    });

    // Expect the steps popup to show with a different message
    const warningPopup2 = await screen.findByText(
      /One of your selected items cannot be transferred via Globus./i
    );
    expect(warningPopup2).toBeTruthy();
    await act(async () => {
      await user.click(await screen.findByText('Cancel'));
    });

    // Deselect the globus enabled dataset
    await act(async () => {
      await user.click(firstCheckBox);
    });

    // Start transfer again
    await act(async () => {
      await user.click(globusTransferBtn);
    });

    // Expect the steps popup to show with a different message
    const warningPopup3 = await screen.findByText(
      /None of your selected items can be transferred via Globus at this time./i
    );
    expect(warningPopup3).toBeTruthy();

    await act(async () => {
      await user.click(await screen.findByText('Ok'));
    });

    // Test that transfer is started with only enabled datasets

    // Re-select the globus enabled dataset
    await act(async () => {
      await user.click(firstCheckBox);
    });

    // Check that the non-globus ready option is currently selected
    await act(async () => {
      await user.click(secondCheckBox);
    });
    expect(secondCheckBox).toBeChecked();

    // Start transfer again
    await act(async () => {
      await user.click(globusTransferBtn);
    });

    // Click OK at the popup to proceed with globus transfer
    await act(async () => {
      await user.click(await screen.findByText('Ok'));
    });

    // Check that the non-globus ready option was deselected
    expect(secondCheckBox).not.toBeChecked();

    app.unmount();
  }, 55000);

  xit('Download form renders and transfer popup form shows after clicking Transfer.', async () => {
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
    await act(async () => {
      await user.click(addBtn);
    });

    // Check 'Added items(s) to the cart' message appears
    const addText = await waitFor(
      () => getAllByText('Added item(s) to your cart')[0]
    );
    expect(addText).toBeTruthy();

    // Switch to the cart page
    const cartBtn = getByTestId('cartPageLink');
    await act(async () => {
      await user.click(cartBtn);
    });

    // Select item for globus transfer
    const firstCheckBox = getByRole('checkbox');
    expect(firstCheckBox).toBeTruthy();
    await act(async () => {
      await user.click(firstCheckBox);
    });

    // Click Transfer button
    const globusTransferBtn = getByRole('button', {
      name: /download transfer/i,
    });
    expect(globusTransferBtn).toBeTruthy();
    await act(async () => {
      await user.click(globusTransferBtn);
    });

    // Expect the transfer popup to show
    const globusTransferPopup = getByText(/Steps for Globus transfer:/i);
    expect(globusTransferPopup).toBeTruthy();
  });

  xit('Clicking cancel hides the transfer popup', async () => {
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
    await act(async () => {
      await user.click(addBtn);
    });

    // Check 'Added items(s) to the cart' message appears
    const addText = await waitFor(
      () => getAllByText('Added item(s) to your cart')[0]
    );
    expect(addText).toBeTruthy();

    // Switch to the cart page
    const cartBtn = getByTestId('cartPageLink');
    await act(async () => {
      await user.click(cartBtn);
    });

    // Select item for globus transfer
    const firstCheckBox = getByRole('checkbox');
    expect(firstCheckBox).toBeTruthy();
    await act(async () => {
      await user.click(firstCheckBox);
    });

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
    await act(async () => {
      await user.click(globusTransferBtn);
    });

    // Get the transfer dialog popup component
    const popupModal = getByRole('dialog');
    expect(popupModal).toBeTruthy();

    // The dialog should be visible
    expect(popupModal).toBeVisible();

    // Click Cancel to end transfer steps
    const cancelBtn = getByText('Cancel');
    expect(cancelBtn).toBeTruthy();
    await act(async () => {
      await user.click(cancelBtn);
    });

    // Expect the dialog to not be visible
    expect(popupModal).not.toBeVisible();
  });

  xit('Globus Transfer popup will show sign-in as first step when no tokens detected', async () => {
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
    await act(async () => {
      await user.click(addBtn);
    });

    // Check 'Added items(s) to the cart' message appears
    const addText = await waitFor(
      () => getAllByText('Added item(s) to your cart')[0]
    );
    expect(addText).toBeTruthy();

    // Switch to the cart page
    const cartBtn = getByTestId('cartPageLink');
    await act(async () => {
      await user.click(cartBtn);
    });

    // Select item for globus transfer
    const firstCheckBox = getByRole('checkbox');
    expect(firstCheckBox).toBeTruthy();
    await act(async () => {
      await user.click(firstCheckBox);
    });

    // Click Transfer button
    const globusTransferBtn = getByRole('button', {
      name: /download transfer/i,
    });
    expect(globusTransferBtn).toBeTruthy();
    await act(async () => {
      await user.click(globusTransferBtn);
    });

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
    await act(async () => {
      await user.click(yesBtn);
    });

    // Expect the dialog to not be visible
    expect(popupModal).not.toBeVisible();
  });

  xit('Globus Transfer popup will show sign-in as first step when transfer token is expired', async () => {
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
    await act(async () => {
      await user.click(addBtn);
    });

    // Check 'Added items(s) to the cart' message appears
    const addText = await waitFor(
      () => getAllByText('Added item(s) to your cart')[0]
    );
    expect(addText).toBeTruthy();

    // Switch to the cart page
    const cartBtn = getByTestId('cartPageLink');
    await act(async () => {
      await user.click(cartBtn);
    });

    // Select item for globus transfer
    const firstCheckBox = getByRole('checkbox');
    expect(firstCheckBox).toBeTruthy();
    await act(async () => {
      await user.click(firstCheckBox);
    });

    // Click Transfer button
    const globusTransferBtn = getByRole('button', {
      name: /download transfer/i,
    });
    expect(globusTransferBtn).toBeTruthy();
    await act(async () => {
      await user.click(globusTransferBtn);
    });

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
    await act(async () => {
      await user.click(yesBtn);
    });

    // Expect the dialog to not be visible
    expect(popupModal).not.toBeVisible();
  });

  xit('Globus Transfer popup will show sign-in as first step when missing refresh token', async () => {
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
    await act(async () => {
      await user.click(addBtn);
    });

    // Check 'Added items(s) to the cart' message appears
    const addText = await waitFor(
      () => getAllByText('Added item(s) to your cart')[0]
    );
    expect(addText).toBeTruthy();

    // Switch to the cart page
    const cartBtn = getByTestId('cartPageLink');
    await act(async () => {
      await user.click(cartBtn);
    });

    // Select item for globus transfer
    const firstCheckBox = getByRole('checkbox');
    expect(firstCheckBox).toBeTruthy();
    await act(async () => {
      await user.click(firstCheckBox);
    });

    // Click Transfer button
    const globusTransferBtn = getByRole('button', {
      name: /download transfer/i,
    });
    expect(globusTransferBtn).toBeTruthy();
    await act(async () => {
      await user.click(globusTransferBtn);
    });

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
    await act(async () => {
      await user.click(yesBtn);
    });

    // Expect the dialog to not be visible
    expect(popupModal).not.toBeVisible();
  });

  xit('Globus Transfer steps start at select endpoint when refresh and transfer tokens are available', async () => {
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
    await act(async () => {
      await user.click(addBtn);
    });

    // Check 'Added items(s) to the cart' message appears
    const addText = await waitFor(
      () => getAllByText('Added item(s) to your cart')[0]
    );
    expect(addText).toBeTruthy();

    // Switch to the cart page
    const cartBtn = getByTestId('cartPageLink');
    await act(async () => {
      await user.click(cartBtn);
    });

    // Select item for globus transfer
    const firstCheckBox = getByRole('checkbox');
    expect(firstCheckBox).toBeTruthy();
    await act(async () => {
      await user.click(firstCheckBox);
    });

    // Click Transfer button
    const globusTransferBtn = getByRole('button', {
      name: /download transfer/i,
    });
    expect(globusTransferBtn).toBeTruthy();
    await act(async () => {
      await user.click(globusTransferBtn);
    });

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
    await act(async () => {
      await user.click(yesBtn);
    });

    // Expect the dialog to not be visible
    expect(popupModal).not.toBeVisible();
  });

  xit('Collects url tokens for globus transfer steps', async () => {
    // Setting the tokens so that the sign-in step should be skipped
    mockSaveValue(CartStateKeys.cartItemSelections, userCartFixture());

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
    await act(async () => {
      await user.click(addBtn);
    });

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
    await act(async () => {
      await user.click(cartBtn);
    });

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
    await act(async () => {
      await user.click(yesBtn);
    });

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

  xit('Globus Transfer steps popup has endpoint checked if endpoint available', async () => {
    // Setting the tokens so that the endpoint step is completed

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
    await act(async () => {
      await user.click(addBtn);
    });

    // Check 'Added items(s) to the cart' message appears
    const addText = await waitFor(
      () => getAllByText('Added item(s) to your cart')[0]
    );
    expect(addText).toBeTruthy();

    // Switch to the cart page
    const cartBtn = getByTestId('cartPageLink');
    await act(async () => {
      await user.click(cartBtn);
    });

    // Select item for globus transfer
    const firstCheckBox = getByRole('checkbox');
    expect(firstCheckBox).toBeTruthy();
    await act(async () => {
      await user.click(firstCheckBox);
    });

    // Click Transfer button
    const globusTransferBtn = getByRole('button', {
      name: /download transfer/i,
    });
    expect(globusTransferBtn).toBeTruthy();
    await act(async () => {
      await user.click(globusTransferBtn);
    });

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
    await act(async () => {
      await user.click(yesBtn);
    });

    // Expect the dialog to not be visible
    expect(popupModal).not.toBeVisible();
  });

  xit('If endpoint URL is available, process it and continue with sign-in', async () => {
    // Setting the tokens so that the sign-in step should be completed
    mockSaveValue(CartStateKeys.cartItemSelections, userCartFixture());

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
    await act(async () => {
      await user.click(addBtn);
    });

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
    await act(async () => {
      await user.click(cartBtn);
    });

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
    await act(async () => {
      await user.click(yesBtn);
    });

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

  xit('If endpoint URL is available, process it and continue to Transfer process', async () => {
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
    await act(async () => {
      await user.click(addBtn);
    });

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
    await act(async () => {
      await user.click(cartBtn);
    });

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
    await act(async () => {
      await user.click(yesBtn);
    });

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
    await act(async () => {
      await user.click(startBtn);
    });

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
    await act(async () => {
      await user.click(clearAllBtn);
    });
  });

  xit('If endpoint URL is set, and sign in tokens in URL, continue to select endpoint', async () => {
    // Setting the tokens so that the sign-in step should be completed

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
    await act(async () => {
      await user.click(addBtn);
    });

    // Check 'Added items(s) to the cart' message appears
    const addText = await waitFor(
      () => getAllByText('Added item(s) to your cart')[0]
    );
    expect(addText).toBeTruthy();

    // Switch to the cart page
    const cartBtn = getByTestId('cartPageLink');
    await act(async () => {
      await user.click(cartBtn);
    });

    // Select item for globus transfer
    const firstCheckBox = getByRole('checkbox');
    expect(firstCheckBox).toBeTruthy();
    await act(async () => {
      await user.click(firstCheckBox);
    });

    // Click Transfer button
    const globusTransferBtn = getByRole('button', {
      name: /download transfer/i,
    });
    expect(globusTransferBtn).toBeTruthy();
    await act(async () => {
      await user.click(globusTransferBtn);
    });

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
    await act(async () => {
      await user.click(yesBtn);
    });

    // Expect the dialog to not be visible
    expect(popupModal).not.toBeVisible();
  });

  xit('Perform Transfer process when sign in tokens and endpoint are BOTH ready', async () => {
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
    await act(async () => {
      await user.click(addBtn);
    });

    // Check 'Added items(s) to the cart' message appears
    const addText = await waitFor(
      () => getAllByText('Added item(s) to your cart')[0]
    );
    expect(addText).toBeTruthy();

    // Switch to the cart page
    const cartBtn = getByTestId('cartPageLink');
    await act(async () => {
      await user.click(cartBtn);
    });

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
    await act(async () => {
      await user.click(clearAllBtn);
    });
  });

  xit('Perform Transfer will pop a task if max tasks was reached, to keep 10 tasks at most', async () => {
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
    await act(async () => {
      await user.click(addBtn);
    });

    // Check 'Added items(s) to the cart' message appears
    const addText = await waitFor(
      () => getAllByText('Added item(s) to your cart')[0]
    );
    expect(addText).toBeTruthy();

    // Switch to the cart page
    const cartBtn = getByTestId('cartPageLink');
    await act(async () => {
      await user.click(cartBtn);
    });

    // Expand submit history
    const submitHistory = getByText('Task Submit History', { exact: false });
    expect(submitHistory).toBeTruthy();
    await act(async () => {
      await user.click(submitHistory);
    });

    // There should be 10 tasks in task history
    const taskItems = getAllByText('Submitted: ', { exact: false });
    expect(taskItems).toHaveLength(10);

    // Select using default endpoint
    const useDefaultOption = getByText('Default Endpoint');
    expect(useDefaultOption).toBeTruthy();
    await act(async () => {
      await user.click(useDefaultOption);
    });

    // Click Transfer button
    const globusTransferBtn = getByRole('button', {
      name: /download transfer/i,
    });
    expect(globusTransferBtn).toBeTruthy();
    await act(async () => {
      await user.click(globusTransferBtn);
    });

    // Expect warning prompt to say non globus items were selected
    const warningPopup = getByText(
      /Some of your selected items cannot be transfered via Globus./i
    );
    expect(warningPopup).toBeTruthy();

    // Select yes, to continue transfer
    const okBtn = getByText('Ok');
    await act(async () => {
      await user.click(okBtn);
    });

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
    await act(async () => {
      await user.click(addBtn);
    });

    // Check 'Added items(s) to the cart' message appears
    const addText = await waitFor(
      () => getAllByText('Added item(s) to your cart')[0]
    );
    expect(addText).toBeTruthy();

    // Switch to the cart page
    const cartBtn = getByTestId('cartPageLink');
    await act(async () => {
      await user.click(cartBtn);
    });

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
    await act(async () => {
      await user.click(addBtn);
    });

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
    await act(async () => {
      await user.click(cartBtn);
    });

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
    await act(async () => {
      await user.click(addBtn);
    });

    // Check 'Added items(s) to the cart' message appears
    const addText = await waitFor(
      () => getAllByText('Added item(s) to your cart')[0]
    );
    expect(addText).toBeTruthy();

    // Switch to the cart page
    const cartBtn = getByTestId('cartPageLink');
    await act(async () => {
      await user.click(cartBtn);
    });

    // Select item for globus transfer
    const firstCheckBox = getByRole('checkbox');
    expect(firstCheckBox).toBeTruthy();
    await act(async () => {
      await user.click(firstCheckBox);
    });

    // Open download dropdown
    const globusTransferDropdown = within(
      getByTestId('downloadTypeSelector')
    ).getByRole('combobox');

    await openDropdownList(user, globusTransferDropdown);

    // Select wget
    const wgetOption = getAllByText(/wget/i)[2];
    expect(wgetOption).toBeTruthy();
    await act(async () => {
      await user.click(wgetOption);
    });

    // Start wget download
    const downloadBtn = getByText('Download');
    expect(downloadBtn).toBeTruthy();
    await act(async () => {
      await user.click(downloadBtn);
    });

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
