import React from 'react';
import userEvent from '@testing-library/user-event';
import { within, screen } from '@testing-library/react';
import customRender from '../../test/custom-render';
import { rest, server } from '../../test/mock/server';
import { getSearchFromUrl } from '../../common/utils';
import { ActiveSearchQuery } from '../Search/types';
import {
  globusReadyNode,
  saveToLocalStorage,
  makeCartItem,
  mockConfig,
  mockFunction,
  openDropdownList,
  AtomWrapper,
  printElementContents,
} from '../../test/jestTestFunctions';
import App from '../App/App';
import { GlobusEndpoint, GlobusTaskItem, GlobusTokenResponse } from './types';
import {
  globusEndpointFixture,
  globusAccessTokenFixture,
  globusTransferTokenFixture,
  globusAuthScopeFixure,
} from '../../test/mock/fixtures';
import apiRoutes from '../../api/routes';
import DatasetDownloadForm, { GlobusGoals } from './DatasetDownload';
import DataBundlePersister from '../../common/DataBundlePersister';
import { tempStorageGetMock, tempStorageSetMock } from '../../test/mock/mockStorage';
import { AppPage } from '../../common/types';
import {
  CartStateKeys,
  GlobusStateKeys,
  cartDownloadIsLoadingAtom,
  cartItemSelectionsAtom,
  globusSavedEndpointsAtoms,
  globusTaskItemsAtom,
} from '../../common/atoms';

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

jest.mock('../../common/utils', () => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const originalModule = jest.requireActual('../../common/utils');

  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return {
    __esModule: true,
    ...originalModule,
    getCurrentAppPage: () => {
      return AppPage.Cart;
    },
  };
});

// Create fixtures to use in tests
const db = DataBundlePersister.Instance;

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
  authenticated: false,
  globusEnabledNodes: [globusReadyNode],
  globusGoals: GlobusGoals.None,
  testUrlState: { authTokensUrlReady: false, endpointPathUrlReady: false },
  tokensReady: { access: true, transfer: true },
  itemSelections: [makeCartItem('globusReadyItem1', true), makeCartItem('globusReadyItem2', true)],
  savedEndpoints: [validEndpointNoPathSet, validEndpointWithPathSet],
  chosenEndpoint: validEndpointWithPathSet as GlobusEndpoint | null,
  cartDownloadIsLoading: false,
  globusTaskItems: [] as GlobusTaskItem[],
};

function setEndpointUrl(endpointId?: string, path?: string | null): void {
  Object.defineProperty(window, 'location', {
    value: {
      assign: () => {},
      pathname: '/cart/items',
      href: `http://localhost:9443/cart/items?endpoint=testEndpoint&label=test&origin_path=${
        path || testEndpointPath
      }&globfs=empty&endpoint_id=${endpointId || testEndpointId}`,
      search: `?endpoint=testEndpoint&label=test&origin_path=${
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
      href: 'http://localhost:9443/cart/items?code=testCode123&state=testingTransferTokens',
      search: '?code=testCode1234&state=testingTransferTokens',
      replace: () => {},
    },
  });
}

async function initializeComponentForTest(testConfig?: typeof defaultTestConfig): Promise<void> {
  const config = testConfig || defaultTestConfig;

  // Set names of the globus enabled nodes
  mockConfig.GLOBUS_NODES = config.globusEnabledNodes;

  // Set the auth scope by default
  db.set(GlobusStateKeys.globusAuth, globusAuthScopeFixure);

  // Set the auth token state
  if (config.tokensReady.access) {
    db.set(GlobusStateKeys.accessToken, globusAccessTokenFixture);
  }
  if (config.tokensReady.transfer) {
    const transferToken = { ...globusTransferTokenFixture };
    transferToken.created_on = Math.floor(Date.now() / 1000);

    db.set(GlobusStateKeys.transferToken, transferToken);
  }

  // Set the Globus Goals
  saveToLocalStorage<GlobusGoals>(GlobusStateKeys.globusTransferGoalsState, config.globusGoals);

  AtomWrapper.modifyAtomValue(CartStateKeys.cartDownloadIsLoading, config.cartDownloadIsLoading);

  // Set the selected cart items
  AtomWrapper.modifyAtomValue(CartStateKeys.cartItemSelections, config.itemSelections);

  // Set the saved endpoints
  AtomWrapper.modifyAtomValue(GlobusStateKeys.savedGlobusEndpoints, config.savedEndpoints);

  // Set the globus task items
  AtomWrapper.modifyAtomValue(GlobusStateKeys.globusTaskItems, config.globusTaskItems);

  // Default display name if no endpoint is chosen
  let displayName = 'Select Globus Collection';

  // Set the chosen endpoint and display name if it's not null
  if (config.chosenEndpoint !== null) {
    db.set(GlobusStateKeys.userChosenEndpoint, config.chosenEndpoint);

    // If setup has endpoint chosen, set display name to know when component is loaded
    displayName = config.chosenEndpoint.display_name;
  }

  // Set the URL that will exist when component is rendered
  if (config.testUrlState.authTokensUrlReady) {
    setAuthTokensUrl();
  } else if (config.testUrlState.endpointPathUrlReady && config.chosenEndpoint) {
    setEndpointUrl(config.chosenEndpoint.id, config.chosenEndpoint.path);
  }

  db.saveAll();

  // Finally render the component
  if (config.renderFullApp) {
    customRender(<App searchQuery={activeSearch} />);

    await screen.findByText('results found for', { exact: false });

    // Switch to the cart page
    const cartBtn = await screen.findByTestId('cartPageLink');
    await user.click(cartBtn);

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
  db.initializeDataStore({});
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
    await user.click(wgetOption);

    // Start wget download
    const downloadBtn = await screen.findByTestId('downloadDatasetWgetBtn');
    expect(downloadBtn).toBeTruthy();
    await user.click(downloadBtn);

    // Expect download success message to show
    const notice = await screen.findByText('Wget script downloaded successfully!', {
      exact: false,
    });
    expect(notice).toBeTruthy();
  });

  it('displays an error when wget script fails to fetch', async () => {
    await initializeComponentForTest();
    server.use(rest.post(apiRoutes.wget.path, (_req, res, ctx) => res(ctx.status(404))));

    // Open download dropdown
    const globusTransferDropdown = await within(
      await screen.findByTestId('downloadTypeSelector')
    ).findByRole('combobox');

    await openDropdownList(user, globusTransferDropdown);

    // Select wget
    const wgetOption = (await screen.findAllByText(/wget/i))[1];
    expect(wgetOption).toBeTruthy();
    await user.click(wgetOption);

    // Start wget download
    const downloadBtn = await screen.findByTestId('downloadDatasetWgetBtn');
    expect(downloadBtn).toBeTruthy();
    await user.click(downloadBtn);

    // Expect error message to show
    const notice = await screen.findByText('Wget Script Error');
    expect(notice).toBeTruthy();
  });

  it('Clicking cancel hides the transfer popup', async () => {
    await initializeComponentForTest({
      ...defaultTestConfig,
      tokensReady: { access: false, transfer: false },
    });

    // Click Transfer button
    const globusTransferBtn = await screen.findByTestId('downloadDatasetTransferBtn');
    expect(globusTransferBtn).toBeTruthy();
    await user.click(globusTransferBtn);

    // Expect transfer notice for token step
    const transferPopup = await screen.findByText(
      /You will be redirected to obtain globus tokens. Continue?/i
    );
    expect(transferPopup).toBeTruthy();
    await user.click(await screen.findByText('Ok'));

    // Click Cancel to end transfer steps
    const cancelBtn = await screen.findByText('Cancel');
    expect(cancelBtn).toBeTruthy();
    await user.click(cancelBtn);

    // Expect the dialog to not be visible
    expect(transferPopup).not.toBeVisible();
  });

  it("Alert popup doesn't show if no globus enabled nodes are configured.", async () => {
    await initializeComponentForTest({
      ...defaultTestConfig,
      globusEnabledNodes: [],
    });

    // Select transfer button and click it
    const globusTransferBtn = await screen.findByTestId('downloadDatasetTransferBtn');
    expect(globusTransferBtn).toBeTruthy();
    await user.click(globusTransferBtn);

    // Expect the transfer popup to show first step
    const globusTransferPopup = await screen.findByText('Globus download initiated successfully!');
    expect(globusTransferPopup).toBeTruthy();
  });

  it('alerts when some items are not transferable via Globus', async () => {
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
    const globusTransferBtn = await screen.findByTestId('downloadDatasetTransferBtn');
    expect(globusTransferBtn).toBeTruthy();
    await user.click(globusTransferBtn);

    // Expect the steps popup to show with below message
    const warningPopup = await screen.findByText(
      /Some of your selected items cannot be transferred via Globus./i,
      { exact: false }
    );
    expect(warningPopup).toBeTruthy();
  });

  it('alerts when one item is not transferable via Globus', async () => {
    const itemSelections = [
      makeCartItem('globusReady', true),
      makeCartItem('notGlobusReady1', false),
    ];

    await initializeComponentForTest({
      ...defaultTestConfig,
      itemSelections,
    });

    // Click Transfer button
    const globusTransferBtn = await screen.findByTestId('downloadDatasetTransferBtn');
    expect(globusTransferBtn).toBeTruthy();
    await user.click(globusTransferBtn);

    // Expect the steps popup to show with below message
    const warningPopup = await screen.findByText(
      /One of your selected items cannot be transferred via Globus./i,
      { exact: false }
    );
    expect(warningPopup).toBeTruthy();
  });

  it('alerts when no items are transferable via Globus', async () => {
    const itemSelections = [
      makeCartItem('notGlobusReady1', false),
      makeCartItem('notGlobusReady2', false),
    ];

    await initializeComponentForTest({
      ...defaultTestConfig,
      itemSelections,
    });

    // Click Transfer button
    const globusTransferBtn = await screen.findByTestId('downloadDatasetTransferBtn');
    expect(globusTransferBtn).toBeTruthy();
    await user.click(globusTransferBtn);

    // Expect the steps popup to show with below message
    const warningPopup = await screen.findByText(
      /None of your selected items can be transferred via Globus at this time./i,
      { exact: false }
    );
    expect(warningPopup).toBeTruthy();
  });

  it('queues Globus eligible transfers when popup Ok is clicked', async () => {
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
    const globusTransferBtn = await screen.findByTestId('downloadDatasetTransferBtn');
    expect(globusTransferBtn).toBeTruthy();
    await user.click(globusTransferBtn);

    // Expect the steps popup to show with below message
    const warningPopup = await screen.findByText(
      /Some of your selected items cannot be transferred via Globus./i,
      { exact: false }
    );
    expect(warningPopup).toBeTruthy();

    // Click OK at the popup to proceed with globus transfer
    const okBtn = await screen.findByText('Ok');
    await user.click(okBtn);

    // Begin the transfer
    const transferPopup = await screen.findByText('Globus download initiated successfully!');
    expect(transferPopup).toBeTruthy();
    await user.click(await screen.findByText('Ok'));
  });

  it('Download form renders, transfer popup form shows get tokens prompt after clicking Transfer.', async () => {
    await initializeComponentForTest({
      ...defaultTestConfig,
      tokensReady: { access: false, transfer: false },
    });

    // Click Transfer button
    const globusTransferBtn = await screen.findByTestId('downloadDatasetTransferBtn');
    expect(globusTransferBtn).toBeTruthy();
    await user.click(globusTransferBtn);

    // Expect transfer notice for token step
    const transferPopup = await screen.findByText(
      /You will be redirected to obtain globus tokens. Continue?/i
    );
    expect(transferPopup).toBeTruthy();
    await user.click(await screen.findByText('Ok'));
  });

  it('Globus Transfer popup will show sign-in as first step when transfer token is null', async () => {
    await initializeComponentForTest({
      ...defaultTestConfig,
      tokensReady: { access: true, transfer: false },
    });

    // Click Transfer button
    const globusTransferBtn = await screen.findByTestId('downloadDatasetTransferBtn');
    expect(globusTransferBtn).toBeTruthy();
    await user.click(globusTransferBtn);

    // Expect transfer notice for token step
    const transferPopup = await screen.findByText(
      /You will be redirected to obtain globus tokens. Continue?/i
    );
    expect(transferPopup).toBeTruthy();
  });

  it('Globus Transfer popup will show sign-in as first step when access token is null', async () => {
    await initializeComponentForTest({
      ...defaultTestConfig,
      tokensReady: { access: false, transfer: true },
    });

    // Click Transfer button
    const globusTransferBtn = await screen.findByTestId('downloadDatasetTransferBtn');
    expect(globusTransferBtn).toBeTruthy();
    await user.click(globusTransferBtn);

    // Expect transfer notice for token step
    const transferPopup = await screen.findByText(
      /You will be redirected to obtain globus tokens. Continue?/i
    );
    expect(transferPopup).toBeTruthy();
  });

  it('Collects url tokens for globus transfer steps', async () => {
    await initializeComponentForTest({
      ...defaultTestConfig,
      globusGoals: GlobusGoals.DoGlobusTransfer,
      testUrlState: { authTokensUrlReady: true, endpointPathUrlReady: false },
    });

    const accessToken = db.get<string>(GlobusStateKeys.accessToken, '');
    const transferToken = db.get<GlobusTokenResponse | null>(GlobusStateKeys.transferToken, null);

    if (transferToken && transferToken.created_on) {
      transferToken.created_on = 1000; // Resets the token's time for comparison equality
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

    const userEndpoint = db.get<GlobusEndpoint | null>(GlobusStateKeys.userChosenEndpoint, null);

    expect(userEndpoint?.path).toEqual(testEndpointPath);
  });

  it('Globus Transfer steps start at select endpoint path when access and transfer tokens are available and endpoint is selected', async () => {
    await initializeComponentForTest({
      ...defaultTestConfig,
      chosenEndpoint: validEndpointNoPathSet,
    });

    // Click Transfer button
    const globusTransferBtn = await screen.findByTestId('downloadDatasetTransferBtn');
    expect(globusTransferBtn).toBeTruthy();
    await user.click(globusTransferBtn);

    // Expect transfer notice for endpoint path step
    const transferPopup = await screen.findByText(
      /You will be redirected to set the path for your selected collection. Continue?/i
    );
    expect(transferPopup).toBeTruthy();
    await user.click(await screen.findByText('Ok'));
  });

  it('Globus Transfer proceeds if tokens and endpoint are ready', async () => {
    await initializeComponentForTest();

    // Click Transfer button
    const globusTransferBtn = await screen.findByTestId('downloadDatasetTransferBtn');
    expect(globusTransferBtn).toBeTruthy();
    await user.click(globusTransferBtn);

    // Expect the transfer popup to show first step
    const globusTransferPopup = await screen.findByText('Globus download initiated successfully!');
    expect(globusTransferPopup).toBeTruthy();
  });

  it('displays an error when Globus Transfer submission fails to reach backend', async () => {
    server.use(rest.post(apiRoutes.globusTransfer.path, (_req, res, ctx) => res(ctx.status(404))));

    await initializeComponentForTest();

    // Click Transfer button
    const globusTransferBtn = await screen.findByTestId('downloadDatasetTransferBtn');
    expect(globusTransferBtn).toBeTruthy();
    await user.click(globusTransferBtn);

    const globusTransferPopup = await screen.findByTestId('globus-transfer-backend-error-msg');
    expect(globusTransferPopup).toBeTruthy();
  });

  it('displays an error when one or more Globus Transfer submissions fail', async () => {
    server.use(
      rest.post(apiRoutes.globusTransfer.path, (_req, res, ctx) =>
        res(
          ctx.status(207),
          ctx.json({ status: 207, successes: [], failures: ['transfer failed'] })
        )
      )
    );

    await initializeComponentForTest();

    // Click Transfer button
    const globusTransferBtn = await screen.findByTestId('downloadDatasetTransferBtn');
    expect(globusTransferBtn).toBeTruthy();
    await user.click(globusTransferBtn);

    const globusTransferPopup = await screen.findByTestId('207-globus-failures-msg');
    expect(globusTransferPopup).toBeTruthy();
  });

  it('displays an error when Globus Transfer returns unhandled status code', async () => {
    server.use(
      rest.post(apiRoutes.globusTransfer.path, (_req, res, ctx) =>
        res(ctx.status(207), ctx.json({ status: 500, successes: [], failures: [] }))
      )
    );

    await initializeComponentForTest();

    // Click Transfer button
    const globusTransferBtn = await screen.findByTestId('downloadDatasetTransferBtn');
    expect(globusTransferBtn).toBeTruthy();
    await user.click(globusTransferBtn);

    const globusTransferPopup = await screen.findByTestId('unhandled-status-globus-failures-msg');
    expect(globusTransferPopup).toBeTruthy();
  });

  it('shows a warning message when Globus transfer response has no data in successes or failures', async () => {
    server.use(
      rest.post(apiRoutes.globusTransfer.path, (_req, res, ctx) =>
        res(ctx.status(200), ctx.json({ status: 200, successes: [], failures: [] }))
      )
    );

    await initializeComponentForTest();

    // Click Transfer button
    const globusTransferBtn = await screen.findByTestId('downloadDatasetTransferBtn');
    expect(globusTransferBtn).toBeTruthy();
    await user.click(globusTransferBtn);

    const warningMessage = await screen.findByText(
      'Globus download requested, however no transfer occurred.'
    );
    expect(warningMessage).toBeInTheDocument();
  });

  it('If endpoint URL is available, process it and continue with sign-in', async () => {
    await initializeComponentForTest({
      ...defaultTestConfig,
      globusGoals: GlobusGoals.DoGlobusTransfer,
      testUrlState: { authTokensUrlReady: false, endpointPathUrlReady: true },
    });
    expect(db.get<GlobusEndpoint | null>(GlobusStateKeys.userChosenEndpoint, null)?.path).toEqual(
      testEndpointPath
    );
  });

  it('Performs endpoint search and selects and saves the endpoint.', async () => {
    await initializeComponentForTest({
      ...defaultTestConfig,
      savedEndpoints: [],
      chosenEndpoint: null,
    });

    // Open download dropdown
    const collectionDropdown = await screen.findByTestId('searchCollectionInput');
    const selectEndpoint = await within(collectionDropdown).findByRole('combobox');
    await openDropdownList(user, selectEndpoint);

    // Select manage collections
    const manageEndpointsBtn = await screen.findByText('Manage Collections');
    expect(manageEndpointsBtn).toBeTruthy();
    await user.click(manageEndpointsBtn);

    const manageCollectionsForm = await screen.findByTestId('manageCollectionsForm');
    expect(manageCollectionsForm).toBeTruthy();

    // Type in endpoint search text
    const endpointSearchInput = await screen.findByPlaceholderText(
      'Search for a Globus Collection'
    );
    expect(endpointSearchInput).toBeTruthy();
    await user.type(endpointSearchInput, 'lc public{enter}');

    // Add endpoint from search results
    const searchResults = await screen.findByTestId('globusEndpointSearchResults');
    expect(searchResults).toBeTruthy();
    const addBtn = await within(searchResults).findByText('Add');
    await user.click(addBtn);

    // The endpoint add button should now show 'Added'
    const addedBtn = await within(searchResults).findByText('Added');
    expect(addedBtn).toBeTruthy();

    // click collapsible to view My Saved Collections
    const mySavedCollections = await screen.findByText('My Saved Globus Collections');
    expect(mySavedCollections).toBeTruthy();
    await user.click(mySavedCollections);

    // Endpoint should now be found within saved globus endpoints table
    const savedEndpoints = await screen.findByTestId('savedGlobusEndpoints');
    expect(savedEndpoints).toBeTruthy();
    const endpoint = await within(savedEndpoints).findByText('LC Public');
    expect(endpoint).toBeTruthy();

    // Save changes to close form
    const saveBtn = await within(manageCollectionsForm).findByText('Save');
    await user.click(saveBtn);

    // Current user chosen endpoint should be undefined
    expect(
      db.get<GlobusEndpoint | undefined>(GlobusStateKeys.userChosenEndpoint, undefined)
    ).toBeUndefined();

    // Open endpoint dropdown and select the endpoint
    await openDropdownList(user, selectEndpoint);

    // Select LC Public endpoint
    const lcPublicOption = (await screen.findAllByText('LC Public'))[0];
    expect(lcPublicOption).toBeTruthy();
    await user.click(lcPublicOption);

    // The user chosen endpoint should now be LC Public
    expect(
      db.get<GlobusEndpoint | null>(GlobusStateKeys.userChosenEndpoint, null)?.display_name
    ).toEqual('LC Public');
  });

  it('Performs sets the path of already saved endpoint.', async () => {
    await initializeComponentForTest({
      ...defaultTestConfig,
      savedEndpoints: [validEndpointNoPathSet],
      chosenEndpoint: null,
    });

    // Open download dropdown
    const collectionDropdown = await screen.findByTestId('searchCollectionInput');
    const selectEndpoint = await within(collectionDropdown).findByRole('combobox');
    await openDropdownList(user, selectEndpoint);

    // Select manage collections
    const manageEndpointsBtn = await screen.findByText('Manage Collections');
    expect(manageEndpointsBtn).toBeTruthy();
    await user.click(manageEndpointsBtn);

    const manageCollectionsForm = await screen.findByTestId('manageCollectionsForm');
    expect(manageCollectionsForm).toBeTruthy();

    // click collapsible to view My Saved Collections
    const mySavedCollections = await screen.findByText('My Saved Globus Collections');
    expect(mySavedCollections).toBeTruthy();
    await user.click(mySavedCollections);

    // Endpoint should be found within saved globus endpoints table
    const savedEndpoints = await screen.findByTestId('savedGlobusEndpoints');
    expect(savedEndpoints).toBeTruthy();
    const endpoint = await within(savedEndpoints).findByText('Endpoint 1');
    expect(endpoint).toBeTruthy();

    // Click the set path button to set path for endpoint
    const setPathBtn = await within(savedEndpoints).findByText('Set Path');
    expect(setPathBtn).toBeTruthy();
    await user.click(setPathBtn);

    // Expect a notification that you will be redirected to set the path
    const noticePopup = await screen.findByText(
      /You will be redirected to set the path for the collection. Continue?/i
    );
    expect(noticePopup).toBeTruthy();
    await user.click(await screen.findByText('Ok'));

    // The Globus Goals should be set to set path
    expect(tempStorageGetMock(GlobusStateKeys.globusTransferGoalsState)).toEqual(
      GlobusGoals.SetEndpointPath
    );
  });

  xit('displays 10 tasks at most in the submit history', async () => {
    await initializeComponentForTest({
      ...defaultTestConfig,
      renderFullApp: true,
      itemSelections: [
        makeCartItem('globusReadyItem1', true),
        makeCartItem('globusReadyItem2', true),
      ],
      globusTaskItems: [
        {
          submitDate: '3/4/2025, 3:55:00 PM',
          taskId: '1011121',
          taskStatusURL: 'https://app.globus.org/activity/1011121/overview',
        },
        {
          submitDate: '3/4/2025, 3:50:00 PM',
          taskId: '9101112',
          taskStatusURL: 'https://app.globus.org/activity/9101112/overview',
        },
        {
          submitDate: '3/4/2025, 3:45:00 PM',
          taskId: '8910111',
          taskStatusURL: 'https://app.globus.org/activity/8910111/overview',
        },
        {
          submitDate: '3/4/2025, 3:40:00 PM',
          taskId: '7891011',
          taskStatusURL: 'https://app.globus.org/activity/7891011/overview',
        },
        {
          submitDate: '3/4/2025, 3:35:00 PM',
          taskId: '6789101',
          taskStatusURL: 'https://app.globus.org/activity/6789101/overview',
        },
        {
          submitDate: '3/4/2025, 3:30:00 PM',
          taskId: '5678910',
          taskStatusURL: 'https://app.globus.org/activity/5678910/overview',
        },
        {
          submitDate: '3/4/2025, 3:25:00 PM',
          taskId: '4567891',
          taskStatusURL: 'https://app.globus.org/activity/4567891/overview',
        },
        {
          submitDate: '3/4/2025, 3:20:00 PM',
          taskId: '3456789',
          taskStatusURL: 'https://app.globus.org/activity/3456789/overview',
        },
        {
          submitDate: '3/4/2025, 3:15:00 PM',
          taskId: '2345678',
          taskStatusURL: 'https://app.globus.org/activity/2345678/overview',
        },
        {
          submitDate: '3/4/2025, 3:10:00 PM',
          taskId: '0123456',
          taskStatusURL: 'https://app.globus.org/activity/0123456/overview',
        },
      ],
    });

    // Expand submit history
    const submitHistory = await screen.findByText('Task Submit History', {
      exact: false,
    });
    expect(submitHistory).toBeTruthy();
    await user.click(submitHistory);

    // There should be 10 tasks in task history
    const taskItems = await screen.findAllByText('Submitted: ', {
      exact: false,
    });
    expect(taskItems).toHaveLength(10);

    console.log('================BEFORE TRANSFER==============');
    printElementContents(undefined);

    // Select transfer button and click it
    const globusTransferBtn = await screen.findByTestId('downloadDatasetTransferBtn');
    expect(globusTransferBtn).toBeTruthy();
    await user.click(globusTransferBtn);

    console.log('================AFTER TRANSFER==============');
    printElementContents(undefined);

    // Expect the transfer to complete successfully
    const globusTransferPopup = await screen.findByText('Globus download initiated successfully!');
    expect(globusTransferPopup).toBeTruthy();

    // There should still only be 10 tasks in task history
    const taskItemsNow = await screen.findAllByText('Submitted: ', {
      exact: false,
    });
    expect(taskItemsNow).toHaveLength(10);

    // The last task should have been popped, and first should be 2nd
    expect(taskItemsNow[1].innerHTML).toEqual('Submitted: 3/4/2025, 3:55:00 PM');
  });

  it('shows the Manage Collections tour', async () => {
    customRender(<DatasetDownloadForm />);
    // Open download dropdown
    const collectionDropdown = await screen.findByTestId('searchCollectionInput');
    const selectEndpoint = await within(collectionDropdown).findByRole('combobox');
    await openDropdownList(user, selectEndpoint);

    // Select manage collections
    const manageEndpointsBtn = await screen.findByText('Manage Collections');
    expect(manageEndpointsBtn).toBeTruthy();
    await user.click(manageEndpointsBtn);
    const collectionsModal = await screen.findByTestId('manageCollectionsForm');
    const tourBtn = await within(collectionsModal).findByRole('img', { name: 'question' });
    await user.click(tourBtn);
    const tourModal = await screen.findByRole('heading', { name: 'Manage My Collections Tour' });
    expect(tourModal).toBeInTheDocument();
  });

  it('Shows an alert when a collection search fails in the manage collections form', async () => {
    server.use(
      rest.get(apiRoutes.globusSearchEndpoints.path, (_req, res, ctx) => res(ctx.status(500)))
    );

    await initializeComponentForTest({
      ...defaultTestConfig,
      savedEndpoints: [],
      chosenEndpoint: null,
    });

    // Open download dropdown
    const collectionDropdown = await screen.findByTestId('searchCollectionInput');
    const selectEndpoint = await within(collectionDropdown).findByRole('combobox');
    await openDropdownList(user, selectEndpoint);

    // Select manage collections
    const manageEndpointsBtn = await screen.findByText('Manage Collections');
    expect(manageEndpointsBtn).toBeTruthy();

    await user.click(manageEndpointsBtn);

    const manageCollectionsForm = await screen.findByTestId('manageCollectionsForm');
    expect(manageCollectionsForm).toBeTruthy();

    // Type in endpoint search text
    const endpointSearchInput = await screen.findByPlaceholderText(
      'Search for a Globus Collection'
    );
    expect(endpointSearchInput).toBeTruthy();
    await user.type(endpointSearchInput, 'lc public{enter}');

    // Expect an alert to show up
    const alertPopup = await screen.findByText(
      'An error occurred while searching for collections. Please try again later.'
    );
    expect(alertPopup).toBeTruthy();
  });

  it('removes all tasks when clicking the Clear All button', async () => {
    await initializeComponentForTest({
      ...defaultTestConfig,
      renderFullApp: true,
      globusTaskItems: [
        {
          submitDate: '3/4/2025, 3:20:00 PM',
          taskId: '3456789',
          taskStatusURL: 'https://app.globus.org/activity/3456789/overview',
        },
        {
          submitDate: '3/4/2025, 3:15:00 PM',
          taskId: '2345678',
          taskStatusURL: 'https://app.globus.org/activity/2345678/overview',
        },
        {
          submitDate: '3/4/2025, 3:10:00 PM',
          taskId: '0123456',
          taskStatusURL: 'https://app.globus.org/activity/0123456/overview',
        },
      ],
    });

    // Expand submit history
    const submitHistory = await screen.findByText('Task Submit History', {
      exact: false,
    });
    expect(submitHistory).toBeInTheDocument();
    await user.click(submitHistory);

    // There should be 3 tasks in task history
    const taskItems = await screen.findAllByText('Submitted: ', { exact: false });
    expect(taskItems).toHaveLength(3);

    // Click clear all button
    const clearAllBtn = await screen.findByTestId('clear-all-submitted-globus-tasks');
    await user.click(clearAllBtn);

    // There should be 0 tasks in task history
    const taskItemsNow = screen.queryAllByText('Submitted: ', { exact: false });
    expect(taskItemsNow).toHaveLength(0);
  });

  it('shows a confirmation dialog when Reset Tokens is clicked', async () => {
    await initializeComponentForTest();

    // Open the dropdown menu
    const globusTransferDropdown = await within(
      await screen.findByTestId('downloadTypeSelector')
    ).findByRole('combobox');
    await openDropdownList(user, globusTransferDropdown);

    // Select Globus
    const globusOption = (await screen.findAllByText(/Globus/i))[1];
    expect(globusOption).toBeTruthy();
    await user.click(globusOption);

    // Open the transfer button menu
    const transferButtonMenu = (await screen.findByTestId('downloadDatasetTransferBtns'))
      .lastElementChild;
    expect(transferButtonMenu).toBeTruthy();
    if (transferButtonMenu) {
      await user.click(transferButtonMenu);
    }

    // Click Reset Tokens
    const resetTokensOption = await screen.findByText('Reset Tokens');
    expect(resetTokensOption).toBeTruthy();
    await user.click(resetTokensOption);

    // Expect confirmation dialog to show
    const confirmationDialog = await screen.findByText(
      /If you haven't performed a Globus transfer in a while, or you ran into some issues, it may help to get new tokens./i
    );
    expect(confirmationDialog).toBeTruthy();
  });

  it('resets tokens when Reset Tokens confirmation dialog Ok is clicked', async () => {
    await initializeComponentForTest();

    // Open the dropdown menu
    const globusTransferDropdown = await within(
      await screen.findByTestId('downloadTypeSelector')
    ).findByRole('combobox');
    await openDropdownList(user, globusTransferDropdown);

    // Select Globus
    const globusOption = (await screen.findAllByText(/Globus/i))[1];
    expect(globusOption).toBeTruthy();
    await user.click(globusOption);

    // Open the transfer button menu
    const transferButtonMenu = (await screen.findByTestId('downloadDatasetTransferBtns'))
      .lastElementChild;
    expect(transferButtonMenu).toBeTruthy();
    if (transferButtonMenu) {
      await user.click(transferButtonMenu);
    }

    // Click Reset Tokens
    const resetTokensOption = await screen.findByText('Reset Tokens');
    expect(resetTokensOption).toBeTruthy();
    await user.click(resetTokensOption);

    // Confirm reset tokens
    const okButton = await screen.findByText('Ok');
    expect(okButton).toBeTruthy();
    await user.click(okButton);

    // Expect tokens to be reset
    const accessToken = db.get<string | null>(GlobusStateKeys.accessToken, null);
    const transferToken = db.get<GlobusTokenResponse | null>(GlobusStateKeys.transferToken, null);
    expect(accessToken).toBeNull();
    expect(transferToken).toBeNull();

    // Expect reset notice to show
    const resetNotice = await screen.findByText('Globus Auth tokens reset!', { exact: false });
    expect(resetNotice).toBeTruthy();
  });
});
