import React from 'react';
import userEvent from '@testing-library/user-event';
import { act, within, screen } from '@testing-library/react';
import customRender from '../../test/custom-render';
import { rest, server } from '../../test/mock/server';
import { getSearchFromUrl } from '../../common/utils';
import { ActiveSearchQuery, RawSearchResults } from '../Search/types';
import {
  globusReadyNode,
  makeCartItem,
  mockConfig,
  mockFunction,
  openDropdownList,
  tempStorageGetMock,
  tempStorageSetMock,
} from '../../test/jestTestFunctions';
import App from '../App/App';
import { GlobusEndpoint, GlobusTokenResponse } from './types';
import GlobusStateKeys from './recoil/atom';
import CartStateKeys from '../Cart/recoil/atoms';
import {
  globusEndpointFixture,
  globusAccessTokenFixture,
  globusTransferTokenFixture,
} from '../../test/mock/fixtures';
import apiRoutes from '../../api/routes';
import DatasetDownloadForm, { GlobusGoals } from './DatasetDownload';
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

// Create fixtures to use in tests
const dp = DataPersister.Instance;

const testEndpointPath = 'testPathValid';
const testEndpointId = 'endpoint1';

const validEndpointNoPathSet = globusEndpointFixture(
  testEndpointId,
  'Endpoint 1',
  'GCSv5_mapped_collection',
  'id1234567',
  'ownerId123',
  'subscriptId123'
);

const validEndpointWithPathSet = globusEndpointFixture(
  'endpoint2',
  'Endpoint 2',
  'GCSv5_mapped_collection',
  'id2345678',
  'ownerId234',
  'subscriptId234',
  testEndpointPath
);

const defaultTestConfig = {
  renderFullApp: false,
  globusEnabledNodes: [globusReadyNode],
  globusGoals: GlobusGoals.None,
  testUrlState: { authTokensUrlReady: false, endpointPathUrlReady: false },
  tokensReady: { access: true, transfer: true },
  itemSelections: [
    makeCartItem('globusReadyItem1', true),
    makeCartItem('globusReadyItem2', true),
  ],
  savedEndpoints: [validEndpointNoPathSet, validEndpointWithPathSet],
  chosenEndpoint: validEndpointWithPathSet as GlobusEndpoint | null,
};

function setEndpointUrl(endpointId?: string, path?: string | null): void {
  Object.defineProperty(window, 'location', {
    value: {
      assign: () => {},
      pathname: '/cart/items',
      href: `https://localhost:3000/cart/items?endpoint=testEndpoint&label=test&path=${
        path || testEndpointPath
      }&globfs=empty&endpoint_id=${endpointId || testEndpointId}`,
      search: `?endpoint=testEndpoint&label=test&path=${
        path || testEndpointPath
      }&globfs=empty&endpoint_id=${endpointId || testEndpointId}`,
      replace: () => {},
    },
  });
}

function setAuthTokensUrl(): void {
  Object.defineProperty(window, 'location', {
    value: {
      assign: () => {},
      pathname: '/cart/items',
      href:
        'https://localhost:3000/cart/items?code=testCode123&state=testingTransferTokens',
      search: '?code=testCode1234&state=testingTransferTokens',
      replace: () => {},
    },
  });
}

async function initializeComponentForTest(
  testConfig?: typeof defaultTestConfig
): Promise<void> {
  const config = testConfig || defaultTestConfig;

  // Set names of the globus enabled nodes
  mockConfig.globusEnabledNodes = config.globusEnabledNodes;

  // Set the Globus Goals
  tempStorageSetMock(
    GlobusStateKeys.globusTransferGoalsState,
    config.globusGoals
  );

  // Set the auth token state
  if (config.tokensReady.access) {
    dp.addNewVar(
      GlobusStateKeys.accessToken,
      globusAccessTokenFixture,
      () => {}
    );
  }
  if (config.tokensReady.transfer) {
    dp.addNewVar(
      GlobusStateKeys.transferToken,
      globusTransferTokenFixture,
      () => {}
    );
  }

  // Set the selected cart items
  tempStorageSetMock(CartStateKeys.cartItemSelections, config.itemSelections);

  // Set the saved endpoints
  tempStorageSetMock(
    GlobusStateKeys.savedGlobusEndpoints,
    config.savedEndpoints
  );

  // Default display name if no endpoint is chosen
  let displayName = 'Select Globus Collection';

  // Set the chosen endpoint and display name if it's not null
  if (config.chosenEndpoint !== null) {
    tempStorageSetMock(
      GlobusStateKeys.userChosenEndpoint,
      config.chosenEndpoint
    );

    // If setup has endpoint chosen, set display name to know when component is loaded
    displayName = config.chosenEndpoint.display_name;
  }

  // Set the URL that will exist when component is rendered
  if (config.testUrlState.authTokensUrlReady) {
    setAuthTokensUrl();
  } else if (
    config.testUrlState.endpointPathUrlReady &&
    config.chosenEndpoint
  ) {
    setEndpointUrl(config.chosenEndpoint.id, config.chosenEndpoint.path);
  }

  // Finally render the component
  if (config.renderFullApp) {
    customRender(<App searchQuery={activeSearch} />);

    await screen.findByText('results found for', { exact: false });

    // Check first row renders and click the checkbox
    const firstRow = (await screen.findAllByRole('row'))[0];

    // Check first row has add button and click it
    const addBtn = await within(firstRow).findByRole('img', { name: 'plus' });
    expect(addBtn).toBeTruthy();
    await act(async () => {
      await user.click(addBtn);
    });

    // Check 'Added items(s) to the cart' message appears
    const addText = (
      await screen.findAllByText('Added item(s) to your cart')
    )[0];
    expect(addText).toBeTruthy();

    // Switch to the cart page
    const cartBtn = await screen.findByTestId('cartPageLink');
    await act(async () => {
      await user.click(cartBtn);
    });

    // Wait for cart summary to load
    await screen.findByText('Your Cart Summary', { exact: false });
  } else {
    customRender(<DatasetDownloadForm />);

    // Wait for component to load
    await screen.findAllByText(new RegExp(displayName, 'i'));
  }
}

beforeEach(() => {
  // Ensure persistent storage is clear before each test
  dp.initializeDataStore({});
});

describe('DatasetDownload form tests', () => {
  it('Download form renders.', async () => {
    const downloadForm = customRender(<DatasetDownloadForm />);
    expect(downloadForm).toBeTruthy();

    await downloadForm.findByTestId('downloadTypeSelector');
  });

  it('Start the wget transfer after adding an item to cart', async () => {
    await initializeComponentForTest();

    // Open download dropdown
    const globusTransferDropdown = await within(
      await screen.findByTestId('downloadTypeSelector')
    ).findByRole('combobox');

    await openDropdownList(user, globusTransferDropdown);

    // Select wget
    const wgetOption = (await screen.findAllByText(/wget/i))[1];
    expect(wgetOption).toBeTruthy();
    await act(async () => {
      await user.click(wgetOption);
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
  });

  it('Clicking cancel hides the transfer popup', async () => {
    await initializeComponentForTest({
      ...defaultTestConfig,
      tokensReady: { access: false, transfer: false },
    });

    // Click Transfer button
    const globusTransferBtn = await screen.findByRole('button', {
      name: /download transfer/i,
    });
    expect(globusTransferBtn).toBeTruthy();
    await act(async () => {
      await user.click(globusTransferBtn);
    });

    // Expect transfer notice for token step
    const transferPopup = await screen.findByText(
      /You will be redirected to obtain globus tokens. Continue?/i
    );
    expect(transferPopup).toBeTruthy();
    await act(async () => {
      await user.click(await screen.findByText('Ok'));
    });

    // Click Cancel to end transfer steps
    const cancelBtn = await screen.findByText('Cancel');
    expect(cancelBtn).toBeTruthy();
    await act(async () => {
      await user.click(cancelBtn);
    });

    // Expect the dialog to not be visible
    expect(transferPopup).not.toBeVisible();
  });

  it("Alert popup doesn't show if no globus enabled nodes are configured.", async () => {
    await initializeComponentForTest({
      ...defaultTestConfig,
      globusEnabledNodes: [],
    });

    // Select transfer button and click it
    const globusTransferBtn = await screen.findByTestId('downloadDatasetBtn');
    expect(globusTransferBtn).toBeTruthy();
    await act(async () => {
      await user.click(globusTransferBtn);
    });

    // Expect the transfer popup to show first step
    const globusTransferPopup = await screen.findByText(
      /Globus transfer task submitted successfully!/i
    );
    expect(globusTransferPopup).toBeTruthy();
  });

  it('Alert popup indicates a dataset is not globus enabled.', async () => {
    const itemSelections = [
      makeCartItem('globusReady', true),
      makeCartItem('notGlobusReady1', false),
      makeCartItem('notGlobusReady2', false),
    ];

    await initializeComponentForTest({
      ...defaultTestConfig,
      itemSelections,
    });

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

    // Select to cancel the transfer (leaving selections alone)
    await act(async () => {
      await user.click(await screen.findByText('Cancel'));
    });

    // Remove a non-globus-ready item
    act(() => {
      dp.setValue(
        CartStateKeys.cartItemSelections,
        [itemSelections[0], itemSelections[1]],
        false
      );
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

    // Remove globus-ready item
    act(() => {
      dp.setValue(
        CartStateKeys.cartItemSelections,
        [itemSelections[1], itemSelections[2]],
        false
      );
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

    // Reset the selected cart items to 3 items
    act(() => {
      dp.setValue(CartStateKeys.cartItemSelections, itemSelections, false);
    });

    // The number of items in the cart should be 3
    expect(
      dp.getValue<RawSearchResults>(CartStateKeys.cartItemSelections)?.length
    ).toEqual(3);

    // Start transfer again
    await act(async () => {
      await user.click(globusTransferBtn);
    });

    // Expect the steps popup to show with below message
    const warningPopup = await screen.findByText(
      /Some of your selected items cannot be transferred via Globus./i,
      { exact: false }
    );
    expect(warningPopup).toBeTruthy();

    // Click OK at the popup to proceed with globus transfer
    await act(async () => {
      await user.click(await screen.findByText('Ok'));

      // If clicking 'OK' the non-globus-ready items should be removed, leaving only 1
      expect(
        dp.getValue<RawSearchResults>(CartStateKeys.cartItemSelections)?.length
      ).toEqual(1);
    });

    // Begin the transfer
    const transferPopup = await screen.findByText(
      /Globus transfer task submitted successfully!/i
    );
    expect(transferPopup).toBeTruthy();
    await act(async () => {
      await user.click(await screen.findByText('Ok'));
    });
  });

  it('Download form renders, transfer popup form shows get tokens prompt after clicking Transfer.', async () => {
    await initializeComponentForTest({
      ...defaultTestConfig,
      tokensReady: { access: false, transfer: false },
    });

    // Click Transfer button
    const globusTransferBtn = await screen.findByRole('button', {
      name: /download transfer/i,
    });
    expect(globusTransferBtn).toBeTruthy();
    await act(async () => {
      await user.click(globusTransferBtn);
    });

    // Expect transfer notice for token step
    const transferPopup = await screen.findByText(
      /You will be redirected to obtain globus tokens. Continue?/i
    );
    expect(transferPopup).toBeTruthy();
    await act(async () => {
      await user.click(await screen.findByText('Ok'));
    });
  });

  it('Globus Transfer popup will show sign-in as first step when transfer token is null', async () => {
    await initializeComponentForTest({
      ...defaultTestConfig,
      tokensReady: { access: true, transfer: false },
    });

    // Click Transfer button
    const globusTransferBtn = await screen.findByRole('button', {
      name: /download transfer/i,
    });
    expect(globusTransferBtn).toBeTruthy();
    await act(async () => {
      await user.click(globusTransferBtn);
    });

    // Expect transfer notice for token step
    const transferPopup = await screen.findByText(
      /You will be redirected to obtain globus tokens. Continue?/i
    );
    expect(transferPopup).toBeTruthy();
    await act(async () => {
      await user.click(await screen.findByText('Ok'));
    });

    // Expect the dialog to not be visible
    expect(transferPopup).not.toBeVisible();
  });

  it('Globus Transfer popup will show sign-in as first step when access token is null', async () => {
    await initializeComponentForTest({
      ...defaultTestConfig,
      tokensReady: { access: false, transfer: true },
    });

    // Click Transfer button
    const globusTransferBtn = await screen.findByRole('button', {
      name: /download transfer/i,
    });
    expect(globusTransferBtn).toBeTruthy();
    await act(async () => {
      await user.click(globusTransferBtn);
    });

    // Expect transfer notice for token step
    const transferPopup = await screen.findByText(
      /You will be redirected to obtain globus tokens. Continue?/i
    );
    expect(transferPopup).toBeTruthy();
    await act(async () => {
      await user.click(await screen.findByText('Ok'));
    });

    // Expect the dialog to not be visible
    expect(transferPopup).not.toBeVisible();
  });

  it('Collects url tokens for globus transfer steps', async () => {
    await initializeComponentForTest({
      ...defaultTestConfig,
      globusGoals: GlobusGoals.DoGlobusTransfer,
      testUrlState: { authTokensUrlReady: true, endpointPathUrlReady: false },
    });

    const accessToken = dp.getValue(GlobusStateKeys.accessToken);
    const transferToken = (await dp.getValue(
      GlobusStateKeys.transferToken
    )) as GlobusTokenResponse;

    if (transferToken && transferToken.created_on) {
      transferToken.created_on = 0; // Resets the token's time for comparison equality
    }
    expect(accessToken).toEqual(globusAccessTokenFixture);
    expect(transferToken).toEqual(globusTransferTokenFixture);

    tempStorageSetMock('pkce-pass', undefined);
  });

  it('Collects the endpoint path for globus transfer', async () => {
    await initializeComponentForTest({
      ...defaultTestConfig,
      testUrlState: { authTokensUrlReady: false, endpointPathUrlReady: true },
    });

    const userEndpoint = dp.getValue<GlobusEndpoint>(
      GlobusStateKeys.userChosenEndpoint
    );

    expect(userEndpoint?.path).toEqual(testEndpointPath);
  });

  it('Globus Transfer steps start at select endpoint path when access and transfer tokens are available and endpoint is selected', async () => {
    await initializeComponentForTest({
      ...defaultTestConfig,
      chosenEndpoint: validEndpointNoPathSet,
    });

    // Click Transfer button
    const globusTransferBtn = await screen.findByRole('button', {
      name: /download transfer/i,
    });
    expect(globusTransferBtn).toBeTruthy();
    await act(async () => {
      await user.click(globusTransferBtn);
    });

    // Expect transfer notice for endpoint path step
    const transferPopup = await screen.findByText(
      /You will be redirected to set the path for your selected collection. Continue?/i
    );
    expect(transferPopup).toBeTruthy();
    await act(async () => {
      await user.click(await screen.findByText('Ok'));
    });
  });

  it('Globus Transfer proceeds if tokens and endpoint are ready', async () => {
    await initializeComponentForTest();

    // Click Transfer button
    const globusTransferBtn = await screen.findByRole('button', {
      name: /download transfer/i,
    });
    expect(globusTransferBtn).toBeTruthy();
    await act(async () => {
      await user.click(globusTransferBtn);
    });

    // Expect the transfer popup to show first step
    const globusTransferPopup = await screen.findByText(
      /Globus transfer task submitted successfully!/i
    );
    expect(globusTransferPopup).toBeTruthy();
  });

  it('If endpoint URL is available, process it and continue with sign-in', async () => {
    await initializeComponentForTest({
      ...defaultTestConfig,
      globusGoals: GlobusGoals.DoGlobusTransfer,
      testUrlState: { authTokensUrlReady: false, endpointPathUrlReady: true },
    });

    expect(
      dp.getValue<GlobusEndpoint>(GlobusStateKeys.userChosenEndpoint)?.path
    ).toEqual(testEndpointPath);
  });

  it('Performs endpoint search and selects and saves the endpoint.', async () => {
    await initializeComponentForTest({
      ...defaultTestConfig,
      savedEndpoints: [],
      chosenEndpoint: null,
    });

    // Open download dropdown
    const collectionDropdown = await screen.findByTestId(
      'searchCollectionInput'
    );
    const selectEndpoint = await within(collectionDropdown).findByRole(
      'combobox'
    );
    await openDropdownList(user, selectEndpoint);

    // Select manage collections
    const manageEndpointsBtn = await screen.findByText('Manage Collections');
    expect(manageEndpointsBtn).toBeTruthy();
    await act(async () => {
      await user.click(manageEndpointsBtn);
    });

    const manageCollectionsForm = await screen.findByTestId(
      'manageCollectionsForm'
    );
    expect(manageCollectionsForm).toBeTruthy();

    // Type in endpoint search text
    const endpointSearchInput = await screen.findByPlaceholderText(
      'Search for a Globus Collection'
    );
    expect(endpointSearchInput).toBeTruthy();
    await act(async () => {
      await user.type(endpointSearchInput, 'lc public{enter}');
    });

    // Add endpoint from search results
    const searchResults = await screen.findByTestId(
      'globusEndpointSearchResults'
    );
    expect(searchResults).toBeTruthy();
    const addBtn = await within(searchResults).findByText('Add');
    await act(async () => {
      await user.click(addBtn);
    });

    // The endpoint add button should now show 'Added'
    const addedBtn = await within(searchResults).findByText('Added');
    expect(addedBtn).toBeTruthy();

    // click collapsible to view My Saved Collections
    const mySavedCollections = await screen.findByText(
      'My Saved Globus Collections'
    );
    expect(mySavedCollections).toBeTruthy();
    await act(async () => {
      await user.click(mySavedCollections);
    });

    // Endpoint should now be found within saved globus endpoints table
    const savedEndpoints = await screen.findByTestId('savedGlobusEndpoints');
    expect(savedEndpoints).toBeTruthy();
    const endpoint = await within(savedEndpoints).findByText('LC Public');
    expect(endpoint).toBeTruthy();

    // Save changes to close form
    const saveBtn = await within(manageCollectionsForm).findByText('Save');
    await act(async () => {
      await user.click(saveBtn);
    });

    // Current user chosen endpoint should be undefined
    expect(
      dp.getValue<GlobusEndpoint>(GlobusStateKeys.userChosenEndpoint)
    ).toBeUndefined();

    // Open endpoint dropdown and select the endpoint
    await openDropdownList(user, selectEndpoint);

    // Select LC Public endpoint
    const lcPublicOption = (await screen.findAllByText('LC Public'))[0];
    expect(lcPublicOption).toBeTruthy();
    await act(async () => {
      await user.click(lcPublicOption);
    });

    // The user chose endpoint should now be LC Public
    expect(
      dp.getValue<GlobusEndpoint>(GlobusStateKeys.userChosenEndpoint)
        ?.display_name
    ).toEqual('LC Public');
  });

  it('Performs sets the path of already saved endpoint.', async () => {
    await initializeComponentForTest({
      ...defaultTestConfig,
      savedEndpoints: [validEndpointNoPathSet],
      chosenEndpoint: null,
    });

    // Open download dropdown
    const collectionDropdown = await screen.findByTestId(
      'searchCollectionInput'
    );
    const selectEndpoint = await within(collectionDropdown).findByRole(
      'combobox'
    );
    await openDropdownList(user, selectEndpoint);

    // Select manage collections
    const manageEndpointsBtn = await screen.findByText('Manage Collections');
    expect(manageEndpointsBtn).toBeTruthy();
    await act(async () => {
      await user.click(manageEndpointsBtn);
    });

    const manageCollectionsForm = await screen.findByTestId(
      'manageCollectionsForm'
    );
    expect(manageCollectionsForm).toBeTruthy();

    // click collapsible to view My Saved Collections
    const mySavedCollections = await screen.findByText(
      'My Saved Globus Collections'
    );
    expect(mySavedCollections).toBeTruthy();
    await act(async () => {
      await user.click(mySavedCollections);
    });

    // Endpoint should be found within saved globus endpoints table
    const savedEndpoints = await screen.findByTestId('savedGlobusEndpoints');
    expect(savedEndpoints).toBeTruthy();
    const endpoint = await within(savedEndpoints).findByText('Endpoint 1');
    expect(endpoint).toBeTruthy();

    // Click the set path button to set path for endpoint
    const setPathBtn = await within(savedEndpoints).findByText('Set Path');
    expect(setPathBtn).toBeTruthy();

    await act(async () => {
      await user.click(setPathBtn);
    });

    // Expect a notification that you will be redirected to set the path
    const noticePopup = await screen.findByText(
      /You will be redirected to set the path for the collection. Continue?/i
    );
    expect(noticePopup).toBeTruthy();
    await act(async () => {
      await user.click(await screen.findByText('Ok'));

      // The Globus Goals should be set to set path
      expect(
        tempStorageGetMock(GlobusStateKeys.globusTransferGoalsState)
      ).toEqual(GlobusGoals.SetEndpointPath);
    });
  });

  it('Perform Transfer will pop a task if max tasks was reached, to keep 10 tasks at most', async () => {
    tempStorageSetMock(GlobusStateKeys.globusTaskItems, [
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

    await initializeComponentForTest({
      ...defaultTestConfig,
      renderFullApp: true,
    });

    // Expand submit history
    const submitHistory = await screen.findByText('Task Submit History', {
      exact: false,
    });
    expect(submitHistory).toBeTruthy();
    await act(async () => {
      await user.click(submitHistory);
    });

    // There should be 10 tasks in task history
    const taskItems = await screen.findAllByText('Submitted: ', {
      exact: false,
    });
    expect(taskItems).toHaveLength(10);

    // Select transfer button and click it
    const globusTransferBtn = await screen.findByTestId('downloadDatasetBtn');
    expect(globusTransferBtn).toBeTruthy();
    await act(async () => {
      await user.click(globusTransferBtn);
    });

    // Expect the transfer to complete successfully
    const globusTransferPopup = await screen.findByText(
      /Globus transfer task submitted successfully!/i
    );
    expect(globusTransferPopup).toBeTruthy();

    // There should still only be 10 tasks in task history
    const taskItemsNow = await screen.findAllByText('Submitted: ', {
      exact: false,
    });
    expect(taskItemsNow).toHaveLength(10);

    // The last task should have been popped, and first should be 2nd
    expect(taskItemsNow[1].innerHTML).toEqual(
      'Submitted: 11/30/2023, 3:10:00 PM'
    );
  });

  it('Shows an alert when a collection search fails in the manage collections form', async () => {
    server.use(
      rest.get(apiRoutes.globusSearchEndpoints.path, (_req, res, ctx) =>
        res(ctx.status(500))
      )
    );

    await initializeComponentForTest({
      ...defaultTestConfig,
      savedEndpoints: [],
      chosenEndpoint: null,
    });

    // Open download dropdown
    const collectionDropdown = await screen.findByTestId(
      'searchCollectionInput'
    );
    const selectEndpoint = await within(collectionDropdown).findByRole(
      'combobox'
    );
    await openDropdownList(user, selectEndpoint);

    // Select manage collections
    const manageEndpointsBtn = await screen.findByText('Manage Collections');
    expect(manageEndpointsBtn).toBeTruthy();
    await act(async () => {
      await user.click(manageEndpointsBtn);
    });

    const manageCollectionsForm = await screen.findByTestId(
      'manageCollectionsForm'
    );
    expect(manageCollectionsForm).toBeTruthy();

    // Type in endpoint search text
    const endpointSearchInput = await screen.findByPlaceholderText(
      'Search for a Globus Collection'
    );
    expect(endpointSearchInput).toBeTruthy();
    await act(async () => {
      await user.type(endpointSearchInput, 'lc public{enter}');
    });

    // Expect an alert to show up
    const alertPopup = await screen.findByText(
      'An error occurred while searching for collections. Please try again later.'
    );
    expect(alertPopup).toBeTruthy();
  });
});
