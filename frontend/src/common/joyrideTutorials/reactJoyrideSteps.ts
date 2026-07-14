import { AppPage } from '../types';
import { JoyrideTour } from './JoyrideTour';
import { TargetObject } from './TargetObject';

export const delay = (ms: number): Promise<void> => {
  return new Promise((res) => {
    setTimeout(res, ms);
  });
};

/**
 * Waits for an element to appear in the DOM, checking at regular intervals
 * @param selector CSS selector for the element to wait for
 * @param maxTimeout Maximum time to wait in milliseconds (default: 10000ms)
 * @param checkInterval How often to check for the element in milliseconds (default: 500ms)
 * @param customMessage Optional custom message to display when user clicks during wait
 * @returns Promise that resolves to true if element found, false if timeout
 */
export const waitForElement = (
  selector: string,
  maxTimeout?: number,
  checkInterval?: number,
  customMessage?: string,
): Promise<boolean> => {
  /* istanbul ignore next -- @preserve */
  const timeout = maxTimeout ?? 10000;
  /* istanbul ignore next -- @preserve */
  const interval = checkInterval ?? 500;

  // Store custom message globally for React component to access
  /* istanbul ignore else -- @preserve */
  if (customMessage) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    (window as any).tourLoadingMessage = customMessage;
  }

  return new Promise((resolve) => {
    const startTime = Date.now();

    const checkElement = (): void => {
      const element = document.querySelector(selector);

      /* istanbul ignore if -- @preserve */
      if (element) {
        // Clean up custom message when element is found
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
        delete (window as any).tourLoadingMessage;
        resolve(true);
        return;
      }

      const elapsedTime = Date.now() - startTime;
      /* istanbul ignore if -- @preserve */
      if (elapsedTime >= timeout) {
        // Clean up custom message on timeout
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
        delete (window as any).tourLoadingMessage;
        resolve(false);
        return;
      }

      setTimeout(checkElement, interval);
    };

    checkElement();
  });
};

export const elementExists = (className: string): boolean => {
  return document.getElementsByClassName(className).length > 0;
};

export const elementHasState = (classname: string, state: string): boolean => {
  const elem: HTMLElement = document.getElementsByClassName(classname)[0] as HTMLElement;
  if (elem && elem.classList) {
    return elem.classList.contains(`target-state_${state}`);
  }
  return false;
};

export const clickFirstElement = (selector: string): boolean => {
  const elem = document.querySelector(selector) as HTMLElement;
  if (elem) {
    elem.click();
    return true;
  }
  return false;
};

export const hoverFirstElement = (selector: string): boolean => {
  const elem = document.querySelector(selector) as HTMLElement;
  if (elem) {
    elem.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    return true;
  }
  return false;
};

export const unHoverFirstElement = (selector: string): boolean => {
  const elem = document.querySelector(selector) as HTMLElement;
  if (elem) {
    elem.dispatchEvent(new MouseEvent('mouseout', { bubbles: true }));
    return true;
  }
  return false;
};

/* istanbul ignore next -- @preserve  */
const mainTableEmpty = (): boolean => {
  return elementExists('ant-empty-image');
};

/* istanbul ignore next -- @preserve */
const cartIsEmpty = (): boolean => {
  const elem = document.querySelector('#root .ant-tabs-tabpane-active .ant-empty-description');
  if (elem) {
    return elem.innerHTML === 'Your cart is empty';
  }
  return false;
};

/* istanbul ignore next -- @preserve */
const searchLibraryIsEmpty = (): boolean => {
  const elem = document.querySelector('#root .ant-tabs-tabpane-active .ant-empty-description');
  if (elem) {
    return elem.innerHTML === 'Your search library is empty';
  }
  return false;
};

export const defaultTarget = new TargetObject('navbar-logo');

export const miscTargets: Record<string, TargetObject> = {
  defaultTarget,
  questionBtn: new TargetObject(),
};

export const navBarTargets: Record<string, TargetObject> = {
  topSearchBar: new TargetObject(),
  topNavBar: new TargetObject(),
  searchPageBtn: new TargetObject(),
  cartPageBtn: new TargetObject(),
  savedSearchPageBtn: new TargetObject(),
  nodeStatusBtn: new TargetObject(),
  newsBtn: new TargetObject(),
  signInBtn: new TargetObject(),
  helpBtn: new TargetObject(),
  themeSwitchBtn: new TargetObject(),
};

export const searchTableTargets: Record<string, TargetObject> = {
  searchFeaturesArea: new TargetObject(),
  queryString: new TargetObject(),
  resultsFoundText: new TargetObject(),
  searchResultsTable: new TargetObject(),
  downloadSearchBtn: new TargetObject(),
  addSelectedToCartBtn: new TargetObject(),
  saveSearchBtn: new TargetObject(),
};

export const downloadAllModalTargets: Record<string, TargetObject> = {
  setPreferredNodesBtn: new TargetObject(),
};

export const copySearchOptionsTargets: Record<string, TargetObject> = {
  copyMenuBtn: new TargetObject(),
  copySearchLinkBtn: new TargetObject(),
  copyEsgpullSearchQueryBtn: new TargetObject(),
  copyEsgpullDownloadCommandBtn: new TargetObject(),
  copyIntakeEsgfSearchBtn: new TargetObject(),
};

export const leftSidebarTargets: Record<string, TargetObject> = {
  leftSideBar: new TargetObject(),
  selectProjectBtn: new TargetObject(),
  projectSelectLeftSideBtn: new TargetObject(),
  projectWebsiteBtn: new TargetObject(),
  filterByGlobusTransfer: new TargetObject(),
  filterByGlobusTransferAny: new TargetObject(),
  filterByGlobusTransferOnly: new TargetObject(),
  searchFacetsForm: new TargetObject(),
  facetFormGeneral: new TargetObject(),
  facetFormFields: new TargetObject(),
  facetFormCollapseAllBtn: new TargetObject(),
  facetFormExpandAllBtn: new TargetObject(),
  facetFormAdditional: new TargetObject(),
  facetFormAdditionalFields: new TargetObject(),
  facetFormKeywordSearch: new TargetObject(),
  // facetFormFilename: new TargetObject(),
  // facetFormFilenameFields: new TargetObject(),
};

export const topDataRowTargets: Record<string, TargetObject> = {
  searchResultsRowExpandIcon: new TargetObject(),
  searchResultsRowContractIcon: new TargetObject(),
  cartAddBtn: new TargetObject(),
  nodeStatusIcon: new TargetObject(),
  datasetTitle: new TargetObject(),
  fileCount: new TargetObject(),
  totalSize: new TargetObject(),
  versionText: new TargetObject(),
  downloadScriptForm: new TargetObject(),
  downloadScriptOptions: new TargetObject(),
  downloadScriptBtn: new TargetObject(),
  globusReadyStatusIcon: new TargetObject(),
};

export const innerDataRowTargets: Record<string, TargetObject> = {
  filesTab: new TargetObject(),
  metadataTab: new TargetObject(),
  metadataLookupField: new TargetObject(),
  citationTab: new TargetObject(),
  additionalTab: new TargetObject(),
  filesTitle: new TargetObject(),
  dataNode: new TargetObject(),
  dataSize: new TargetObject(),
  downloadDataBtn: new TargetObject(),
  copyOPeNDAPBtn: new TargetObject(),
  copyUrlBtn: new TargetObject(),
  checksum: new TargetObject(),
};

export const cartTourTargets: Record<string, TargetObject> = {
  cartSummary: new TargetObject(),
  datasetBtn: new TargetObject(),
  libraryBtn: new TargetObject(),
  cartItemsTable: new TargetObject(),
  downloadForm: new TargetObject(),
  downloadAllType: new TargetObject(),
  downloadWgetBtn: new TargetObject(),
  downloadTransferBtn: new TargetObject(),
  globusCollectionDropdown: new TargetObject(),
  removeItemsBtn: new TargetObject(),
  setPreferredNodesBtn: new TargetObject(),
};

export const manageCollectionsTourTargets: Record<string, TargetObject> = {
  globusCollectionsForm: new TargetObject(),
  searchCollectionInput: new TargetObject(),
  globusSearchResultsPanel: new TargetObject(),
  globusSearchResults: new TargetObject(),
  mySavedCollectionsPanel: new TargetObject(),
  mySavedCollections: new TargetObject(),
  saveCollectionBtn: new TargetObject(),
  cancelCollectionBtn: new TargetObject(),
};

export const savedSearchTourTargets: Record<string, TargetObject> = {
  savedSearches: new TargetObject(),
  projectDescription: new TargetObject(),
  searchQueryString: new TargetObject(),
  applySearch: new TargetObject(),
  jsonBtn: new TargetObject(),
  removeBtn: new TargetObject(),
};

export const nodeTourTargets: Record<string, TargetObject> = {
  updateTime: new TargetObject(),
  nodeStatusSummary: new TargetObject(),
  nodeColHeader: new TargetObject(),
  onlineColHeader: new TargetObject(),
  sourceColHeader: new TargetObject(),
};

// Used when creating the tour, as the title that user sees
export enum TourTitles {
  Main = 'Main Search Page Tour',
  Cart = 'Data Cart Tour',
  CartDatasetDetails = 'Cart Items Tour',
  CartDownloadOptions = 'Download Options Tour',
  CartManageCollections = 'Manage My Collections Tour',
  SavedSearches = 'Saved Searches Tour',
  NodeStatus = 'Node Status Tour',
  Welcome = 'Welcome Tour',
  MainNavBar = 'Navigation Bar Tour',
  MainFacetsPanel = 'Search Facets Panel Tour',
  MainSearchFeatures = 'Search Features Tour',
  SearchResults = 'Search Results Tour',
}

const addDataRowTourSteps = (tour: JoyrideTour): JoyrideTour => {
  tour
    .addNextStep(
      topDataRowTargets.nodeStatusIcon.selector(),
      "This icon shows the current status of the node which hosts this dataset. When hovering over the icon you will see more detail as to the node's status.",
      'top-start',
    )
    .addNextStep(
      topDataRowTargets.datasetTitle.selector(),
      'Each row provides access to a specific dataset. The title of the dataset is shown here.',
      'top-start',
    )
    .addNextStep(
      topDataRowTargets.fileCount.selector(),
      'This shows how many separate files are contained in this dataset.',
      'top-start',
    )
    .addNextStep(
      topDataRowTargets.totalSize.selector(),
      'This shows the total size of the dataset with all of its files.',
      'top-start',
    )
    .addNextStep(
      topDataRowTargets.versionText.selector(),
      'The version number or preparation date is shown in this column (depending on the dataset).',
      'top-start',
    )
    .addNextStep(
      topDataRowTargets.downloadScriptForm.selector(),
      'If you wish to download the entire dataset, you can do so by first obtaining the download script.',
      'top-start',
    )
    .addNextStep(
      topDataRowTargets.downloadScriptOptions.selector(),
      'This drop-down allows you to select which type of method you want to use for the download.',
      'top',
    )
    .addNextStep(
      topDataRowTargets.downloadScriptBtn.selector(),
      'Clicking this button will begin the download of your script.',
      'top',
    )
    .addNextStep(
      topDataRowTargets.globusReadyStatusIcon.selector(),
      'This icon indicates whether the dataset can be transferred with Globus. A check mark means it is Globus Ready and can be transferred through Globus. When hovering over the icon you will see more detail as to what node this dataset is coming from and whether the node is Globus ready.',
      'bottom-start',
    )
    .addNextStep(
      topDataRowTargets.searchResultsRowExpandIcon.selector(),
      'To view more information about a specific dataset, you can expand the row by clicking this little arrow icon...',
      'top-start',
      /* istanbul ignore next -- @preserve */
      async () => {
        clickFirstElement(topDataRowTargets.searchResultsRowExpandIcon.selector());
        // Wait for files table to load (max 10 seconds, check every 500ms)
        await waitForElement(
          innerDataRowTargets.filesTitle.selector(),
          15000,
          500,
          '<strong>Note:</strong> The files table can take a few seconds to load. You can click <strong>Skip</strong> to exit the tour if you prefer not to wait.',
        );
        clickFirstElement(innerDataRowTargets.filesTab.selector());
      },
    )
    .addNextStep(
      innerDataRowTargets.filesTab.selector(),
      'The file information tab is open by default. Within this tab, it is possible to view individual files in the dataset for access and download.',
      'top-start',
    )
    .addNextStep(
      innerDataRowTargets.filesTitle.selector(),
      'This shows the title of a specific file contained within the dataset.',
      'top-start',
    )
    .addNextStep(
      innerDataRowTargets.dataSize.selector(),
      'This shows the size of the specific file in the dataset.',
      'top-start',
    )
    .addNextStep(
      innerDataRowTargets.downloadDataBtn.selector(),
      'Clicking this button will initiate a direct download of this data file via HTTPS.',
      'top-start',
    )
    .addNextStep(
      innerDataRowTargets.copyUrlBtn.selector(),
      'Clicking this button will copy the HTTP URL of this file directly to your clipboard.',
      'top-start',
    )
    .addNextStep(
      innerDataRowTargets.copyOPeNDAPBtn.selector(),
      'Clicking this button will copy an OPeNDAP URL of this file directly to your clipboard.',
      'top-start',
    )
    .addNextStep(
      innerDataRowTargets.checksum.selector(),
      'The checksum of the specified file is shown here.',
      'top-start',
    )
    .addNextStep(
      innerDataRowTargets.metadataTab.selector(),
      'This is the Metadata tab. If you click it, you can view metadata for the dataset...',
      'top-start',
      /* istanbul ignore next -- @preserve */
      async () => {
        clickFirstElement(innerDataRowTargets.metadataTab.selector());
        // Wait for metadata content to load (max 10 seconds, check every 500ms)
        await waitForElement(innerDataRowTargets.metadataLookupField.selector(), 10000, 500);
      },
    )
    .addNextStep(
      innerDataRowTargets.metadataLookupField.selector(),
      'Besides seeing the metadata listed below, this field can help you search for a specific key/value pair of metadata.',
      'top-start',
      /* istanbul ignore next -- @preserve */
      async () => {
        if (elementExists(innerDataRowTargets.citationTab.class())) {
          clickFirstElement(innerDataRowTargets.citationTab.selector());
          // Wait for citation content to load (max 25 seconds, check every 500ms)
          // Look for the Data Citation Page link (any anchor with target="_blank" and rel="noopener noreferrer")
          await waitForElement(
            'a[target="_blank"][rel="noopener noreferrer"]',
            25000,
            500,
            '<strong>Note:</strong> Citations take a few seconds to load. You can click <strong>Skip</strong> to exit the tour if you prefer not to wait.',
          );
        } else if (!elementExists(innerDataRowTargets.additionalTab.class())) {
          clickFirstElement(topDataRowTargets.searchResultsRowContractIcon.selector());
        }
      },
    )
    .addNextStep(
      innerDataRowTargets.citationTab.selector(),
      'Citation information for the dataset can be viewed within this tab...',
      'top-start',
      /* istanbul ignore next -- @preserve */
      async () => {
        if (elementExists(innerDataRowTargets.additionalTab.class())) {
          clickFirstElement(innerDataRowTargets.additionalTab.selector());
        } else {
          clickFirstElement(topDataRowTargets.searchResultsRowContractIcon.selector());
        }
      },
    )
    .addNextStep(
      innerDataRowTargets.additionalTab.selector(),
      'You can view additional data and sources by clicking this tab.',
      'top-start',
      /* istanbul ignore next -- @preserve */
      async () => {
        clickFirstElement(topDataRowTargets.searchResultsRowContractIcon.selector());
      },
    );

  return tour;
};

// Helper function to add navigation bar tour steps
const addNavBarSteps = (tour: JoyrideTour): JoyrideTour => {
  return tour
    .addNextStep(
      navBarTargets.topNavBar.selector(),
      'This area lets you navigate between pages of Metagrid.',
      'bottom',
    )
    .addNextStep(
      navBarTargets.searchPageBtn.selector(),
      "Clicking this button takes you to the main search page (Metagrid's home page).",
      'bottom',
    )
    .addNextStep(
      navBarTargets.cartPageBtn.selector(),
      'This button takes you to the data cart page where you can view the data you have selected for download.',
      'bottom',
    )
    .addNextStep(
      navBarTargets.savedSearchPageBtn.selector(),
      'To view your currently saved searches, you would click here.',
      'bottom',
    )
    .addNextStep(
      navBarTargets.nodeStatusBtn.selector(),
      'If you are curious about data node status, you can visit the status page by clicking here.',
      'bottom',
    )
    .addNextStep(
      navBarTargets.newsBtn.selector(),
      "Clicking the news button will open up the message center to the right, where you'll find important notes from the admins and developers. You can also view changelog information regarding the latest version of Metagrid.",
      'bottom',
    )
    .addNextStep(
      navBarTargets.signInBtn.selector(),
      'Clicking this button will allow you to sign in to your profile. Or if you are already signed in, it will display your user name.',
      'bottom',
    )
    .addNextStep(
      navBarTargets.helpBtn.selector(),
      "Clicking this 'Help' button will open the support dialog, where you can view interface tours (like this), or get links to helpful documentation.",
      'bottom',
    )
    .addNextStep(
      navBarTargets.themeSwitchBtn.selector(),
      'This button allows you to switch between light and dark themes for Metagrid.',
      'bottom',
    );
};

// Helper function to add facets panel tour steps
const addFacetsPanelSteps = (tour: JoyrideTour): JoyrideTour => {
  tour
    .addNextStep(
      leftSidebarTargets.selectProjectBtn.selector(),
      'To begin a search, you would first select a project from this drop-down.',
      'right',
    )
    .addNextStep(
      leftSidebarTargets.projectWebsiteBtn.selector(),
      'Once a project is selected, if you wish, you can go view the project website by clicking this button.',
      'right',
    );

  // Add tour elements for globus ready filter (if globus enabled nodes has been configured)
  if (window.METAGRID.GLOBUS_NODES.length > 0) {
    tour
      .addNextStep(
        leftSidebarTargets.filterByGlobusTransfer.selector(),
        'This section allows you to filter search results based on Globus transfer availability. There are a set of data nodes that provide the Globus Transfer option, however not all do. You can filter to show all datasets, or only those that can be transferred via Globus.',
        'right',
      )
      .addNextStep(
        leftSidebarTargets.filterByGlobusTransferAny.selector(),
        'Selecting this option will leave the filter off and allow you to see all datasets, including ones that may not have Globus transfer as an option.',
        'right',
      )
      .addNextStep(
        leftSidebarTargets.filterByGlobusTransferOnly.selector(),
        'Selecting this option will filter all datasets, so that only the ones that have Globus transfer as an option will be visible.',
        'right',
      );
  }

  return tour
    .addNextStep(
      leftSidebarTargets.searchFacetsForm.selector(),
      'This area contains various groups of facets and parameters that you can use to filter results from your selected project.',
      'right',
    )
    .addNextStep(
      leftSidebarTargets.facetFormGeneral.selector(),
      'To filter by facets provided within this group, you would open this collapsible form by clicking on it...',
      'right-end',
      /* istanbul ignore next -- @preserve */
      async () => {
        clickFirstElement(leftSidebarTargets.facetFormGeneral.selector());
        await delay(300);
      },
    )
    .addNextStep(
      leftSidebarTargets.facetFormFields.selector(),
      'These are facets that are available within this group. The drop-downs allow you to select multiple items you wish to include in your search. Note that you can search for elements in the drop-down by typing within the input area.',
      'right-start',
      /* istanbul ignore next -- @preserve */
      async () => {
        clickFirstElement(leftSidebarTargets.facetFormGeneral.selector());
        await delay(300);
        // Close facet panels if more than one is open
        if (elementExists(leftSidebarTargets.facetFormCollapseAllBtn.class())) {
          clickFirstElement(leftSidebarTargets.facetFormCollapseAllBtn.selector());
          await delay(50);
        }
      },
    )
    .addNextStep(
      leftSidebarTargets.facetFormExpandAllBtn.selector(),
      "You can quickly expand all the facet panels by clicking this button. Note that there is a scroll bar on the right when the panels don't all fit on the page.",
      'right-end',
      /* istanbul ignore next -- @preserve */
      async () => {
        clickFirstElement(leftSidebarTargets.facetFormExpandAllBtn.selector());
        await delay(300);
      },
    )
    .addNextStep(
      leftSidebarTargets.facetFormAdditionalFields.selector(),
      'This section contains additional properties that you can select to further refine your search results, including the Version Type, Result Type and Versions. Hovering over the question mark icon will further explain the parameter.',
      'right-end',
    )
    .addNextStep(
      leftSidebarTargets.facetFormKeywordSearch.selector(),
      'This input lets you filter your results using a specific keyword. To filter by keyword, you would type in the field then click the magnifying glass icon to add it as a search parameter. Each additional keyword search will be added as an OR to your existing keyword search.',
      'right-end',
    )
    .addNextStep(
      leftSidebarTargets.facetFormCollapseAllBtn.selector(),
      'Clicking the collapse all button will close all the open facet panels.',
      'right-end',
      /* istanbul ignore next -- @preserve */
      async () => {
        clickFirstElement(leftSidebarTargets.facetFormCollapseAllBtn.selector());
        await delay(300);
      },
    );
};

// Helper function to add search features tour steps
const addSearchFeaturesSteps = (tour: JoyrideTour): JoyrideTour => {
  return tour
    .addNextStep(
      searchTableTargets.queryString.selector(),
      "When performing a search, you'll be able to view the resulting query generated by your selections here.",
      'bottom',
    )
    .addNextStep(
      searchTableTargets.resultsFoundText.selector(),
      'This will display how many results were returned from your search.',
      'bottom',
    )
    .addNextStep(
      searchTableTargets.downloadSearchBtn.selector(),
      'The Download All Results button allows you to skip the data cart and download all the datasets returned by your search! After clicking this button, you can set preferred data nodes and choose between wget script or Globus transfer.',
      'bottom',
    )
    .addNextStep(
      searchTableTargets.saveSearchBtn.selector(),
      'If you are happy with your search results and plan to perform this search again, you can save your search by clicking this button.',
      'left',
    )
    .addNextStep(
      copySearchOptionsTargets.copyMenuBtn.selector(),
      'If you click on the copy icon, a drop-down menu will appear with various options for copying your search query into your clipboard.',
      'left-start',
      /* istanbul ignore next -- @preserve */
      async () => {
        hoverFirstElement(copySearchOptionsTargets.copyMenuBtn.selector());
        await delay(200);
      },
    )
    .addNextStep(
      copySearchOptionsTargets.copySearchLinkBtn.selector(),
      'This option creates a shareable link for your search. The Metagrid URL will be copied to your clipboard for you to then paste at your convenience.',
      'left-start',
    )
    .addNextStep(
      copySearchOptionsTargets.copyEsgpullSearchQueryBtn.selector(),
      'This option creates an esgpull search query version of your search and copies it to your clipboard. You can run the command in your shell where esgpull is installed.',
      'left-start',
    )
    .addNextStep(
      copySearchOptionsTargets.copyEsgpullDownloadCommandBtn.selector(),
      'This option creates a simple esgpull download command to run a download. We highly recommend you review the command and test the search results beforehand with the esgpull search option first.',
      'left-start',
    )
    .addNextStep(
      copySearchOptionsTargets.copyIntakeEsgfSearchBtn.selector(),
      'If you need an Intake ESGF search query version of your search, click this button. The python code will attempt to generate the code for a similar search and copy it to your clipboard.',
      'left-start',
      /* istanbul ignore next -- @preserve */
      async () => {
        unHoverFirstElement('.ant-dropdown');
        await delay(200);
      },
    );
};

// Helper function to add search results tour steps (without dataset details)
const addSearchResultsSteps = (tour: JoyrideTour): JoyrideTour => {
  return tour
    .addNextStep(
      searchTableTargets.searchResultsTable.selector(),
      'These are your search results! Each row in the results table is a specific dataset that matches your criteria.',
      'top-start',
    )
    .addNextStep(
      '#root .ant-checkbox',
      'You can select multiple datasets using these checkboxes...',
      'top',
      /* istanbul ignore next -- @preserve */
      async () => {
        clickFirstElement('#root .ant-checkbox');
        // Flag that the check boxes are on
        tour.setTourFlag('boxes-checked', true);
        await delay(500);
      },
    )
    .addNextStep(
      searchTableTargets.addSelectedToCartBtn.selector(),
      'Then to add them to your cart, you would click this button.',
      'bottom-start',
      /* istanbul ignore next -- @preserve */
      async () => {
        clickFirstElement('#root .ant-checkbox');
        // Flag that the check boxes are on
        tour.setTourFlag('boxes-checked', false);
        await delay(500);
      },
    )
    .addNextStep(
      topDataRowTargets.cartAddBtn.selector('plus'),
      'You can also directly add a specific dataset to the cart by clicking its plus button here.',
      'top-start',
    )
    .addNextStep(
      topDataRowTargets.cartAddBtn.selector('minus'),
      'Or you can remove a dataset from the cart by clicking its minus button here.',
      'top-start',
    );
};

export const welcomeTour = new JoyrideTour(TourTitles.Welcome)
  .addNextStep(
    'body',
    'Just a note: We are continually striving to improve the Metagrid user interface and make it more intuitive. However, if you ever feel stuck, please try out the interface tours. The following is a quick tour showing where you can access support.',
    'center',
  )
  .addNextStep(
    navBarTargets.helpBtn.selector(),
    'This help button will open the Metagrid support dialog, which contains interface tours (like this one) as well as helpful resources.',
    'bottom',
  )
  .addNextStep(
    miscTargets.questionBtn.selector(),
    'This question button will also open the Metagrid support dialog. Note that the tour button shown in the support dialog will be specific to the current page you are on.',
    'top-end',
  );

export const createNavBarTour = (): JoyrideTour => {
  const tour = new JoyrideTour(TourTitles.MainNavBar).addNextStep(
    'body',
    'This tour will guide you through the main navigation bar at the top of the page.',
    'center',
  );

  addNavBarSteps(tour);

  tour.addNextStep('body', 'This concludes the navigation bar tour.', 'center');

  return tour;
};

export const createFacetsPanelTour = (): JoyrideTour => {
  const tour = new JoyrideTour(TourTitles.MainFacetsPanel).addNextStep(
    'body',
    'This tour will guide you through the search facets panel on the left side of the page, where you can filter and refine your search results.',
    'center',
  );

  addFacetsPanelSteps(tour);

  tour.addNextStep('body', 'This concludes the search facets panel tour.', 'center');

  return tour;
};

export const createSearchFeaturesTour = (): JoyrideTour => {
  const tour = new JoyrideTour(TourTitles.MainSearchFeatures).addNextStep(
    'body',
    'This tour will guide you through the search features available at the top of the search results, including saving, sharing, and exporting your search.',
    'center',
  );

  addSearchFeaturesSteps(tour);

  tour.addNextStep('body', 'This concludes the search features tour.', 'center');

  return tour;
};

export const createSearchResultsTour = (): JoyrideTour => {
  const tour = new JoyrideTour(TourTitles.SearchResults).addNextStep(
    'body',
    'This tour will guide you through the search results table and how to interact with datasets.',
    'center',
    /* istanbul ignore next -- @preserve */
    async () => {
      // Wait for search results table to load (max 30 seconds, check every 500ms)
      await waitForElement(
        'table tbody tr[id^="cart-items-row"]',
        30000,
        500,
        '<strong>Note:</strong> The search results can take a few seconds to load. Click <strong>Skip</strong> to exit the tour if you prefer not to wait.',
      );
    },
  );

  addSearchResultsSteps(tour);
  addDataRowTourSteps(tour);

  tour.addNextStep('body', 'This concludes the search results tour.', 'center').setOnFinish(
    /* istanbul ignore next -- @preserve */ () => {
      return () => {
        // Clean-up step for when the tour is complete (or skipped)
        if (tour.getTourFlag('boxes-checked')) {
          clickFirstElement('#root .ant-checkbox');
        }
      };
    },
  );

  return tour;
};

export const createMainPageTour = (): JoyrideTour => {
  const tour = new JoyrideTour(TourTitles.Main).addNextStep(
    'body',
    "Welcome to Metagrid! This tour will highlight the main controls and features of the search page. During the tour, click 'Next' to continue, or 'Skip' if you wish to cancel the tour. Let's begin!",
    'center' /* istanbul ignore next -- @preserve */,
    async () => {
      // Wait for search results table to load (max 30 seconds, check every 500ms)
      await waitForElement(
        'table tbody tr[id^="cart-items-row"]',
        30000,
        500,
        '<strong>Note:</strong> The search results can take a few seconds to load. Click <strong>Skip</strong> to exit the tour if you prefer not to wait.',
      );
    },
  );

  // Add all the sub-tour steps without intro/outro messages
  addNavBarSteps(tour);
  addFacetsPanelSteps(tour);
  addSearchFeaturesSteps(tour);
  addSearchResultsSteps(tour);
  addDataRowTourSteps(tour);

  tour
    .addNextStep(
      'body',
      'This concludes the main search page tour. To get a tour of other pages in the app, or repeat this tour again, you can click the big question mark button in the lower-right corner and select the tour in the Support pop-up menu.',
      'center',
    )
    .setOnFinish(
      /* istanbul ignore next -- @preserve */ () => {
        return () => {
          // Clean-up step for when the tour is complete (or skipped)
          if (tour.getTourFlag('boxes-checked')) {
            clickFirstElement('#root .ant-checkbox');
          }
        };
      },
    );

  return tour;
};

export const createCartItemsTour = (setCurrentPage: (page: number) => void): JoyrideTour => {
  let cartItemsAdded = false;

  const tour = new JoyrideTour(TourTitles.Cart)
    .addNextStep(
      'body',
      'The data cart allows you to manage multiple datasets selected for bulk download. This tour will provide an overview of the data cart.',
      'center',
    )
    .addNextStep(
      cartTourTargets.datasetBtn.selector(),
      'Note that we are currently in the data cart tab.',
    )
    .addNextStep(
      cartTourTargets.libraryBtn.selector(),
      'Clicking this would switch you to the search library tab. However we will stay in the data cart for this tour.',
    );

  /* istanbul ignore if -- @preserve */
  // Add steps if the cart or search library is empty, which will add needed items
  if (cartIsEmpty()) {
    cartItemsAdded = true;
    tour
      .addNextStep(
        'body',
        'As you can tell, currently no datasets have been added to your cart. We will need to go to the search page and add a dataset first...',
        'center',
        async (): Promise<void> => {
          await delay(300);
          setCurrentPage(AppPage.Main);
          await delay(1000);
        },
      )
      .addNextStep(
        'body',
        'This is the main search page where we will load a project to add a dataset...',
        'center',
      );
    /* istanbul ignore if -- @preserve */
    // If the main search page is empty, select a project
    if (mainTableEmpty()) {
      tour
        .addNextStep(
          leftSidebarTargets.projectSelectLeftSideBtn.selector(),
          'First we will click this button to load results from a project into the search table...',
          'right',
          () => {
            clickFirstElement(leftSidebarTargets.projectSelectLeftSideBtn.selector());
          },
        )
        .addNextStep(
          leftSidebarTargets.projectSelectLeftSideBtn.selector(),
          "NOTE: The search results may take a few seconds to load... Click 'Next' to continue.",
          'right',
          async () => {
            await delay(1000);
          },
        );
    }
    tour
      .addNextStep(
        searchTableTargets.searchResultsTable.selector(),
        "Let's go ahead and add some datasets to the cart...",
        'top-start',
        /* istanbul ignore next -- @preserve */
        async () => {
          clickFirstElement(topDataRowTargets.cartAddBtn.selector('plus'));
          await delay(500);
          clickFirstElement(topDataRowTargets.cartAddBtn.selector('plus'));
          await delay(500);
        },
      )
      .addNextStep(
        navBarTargets.cartPageBtn.selector(),
        'Now that there are datasets in the cart, we will go view them in the cart page...',
        'bottom',
        /* istanbul ignore next -- @preserve */
        async (): Promise<void> => {
          setCurrentPage(AppPage.Cart);
          await delay(1000);
        },
      );
  }

  tour
    .addNextStep(
      cartTourTargets.cartSummary.selector(),
      "This shows a summary of all the datasets you've added and selected in the cart. From here you can see the number of datasets, files and file size of both the cart and your selected datasets at a glance. Note: The summary is visible to both the data cart and search library.",
    )
    .addNextStep(
      '.ant-table-container',
      'This table shows the datasets that have been added to the cart.',
    )
    .addNextStep(
      topDataRowTargets.cartAddBtn.selector('minus'),
      'You can remove a dataset from the cart by clicking its minus button here.',
      'top-start',
    )
    .addNextStep(
      '#root .ant-checkbox',
      'You can select which datasets to download by clicking their checkboxes, or to select them all, click the top checkbox like so...',
      'top-start',
      /* istanbul ignore next -- @preserve */
      async () => {
        clickFirstElement('#root .ant-checkbox');
        // Flag that the check boxes are on
        tour.setTourFlag('boxes-checked', true);
        await delay(300);
      },
    )
    .addNextStep(
      cartTourTargets.removeItemsBtn.selector(),
      'We can remove all selected items from the cart with this button.',
      'right-start',
      /* istanbul ignore next -- @preserve */
      async () => {
        clickFirstElement('#root .ant-checkbox');
        // Flag that the check boxes are off
        tour.setTourFlag('boxes-checked', false);
        await delay(300);
      },
    )
    .addNextStep(
      'body',
      'This concludes the main cart page tour. To learn more about dataset details in the cart, or download options, check out the specific tours for those topics in the support dialog.',
      'center',
    )
    .setOnFinish(
      /* istanbul ignore next -- @preserve */
      () => {
        // Clean-up step for when the tour is complete (or skipped)
        return async () => {
          if (cartItemsAdded) {
            clickFirstElement(cartTourTargets.removeItemsBtn.selector());
            await delay(500);
            clickFirstElement('.ant-popover-content .ant-btn-primary');
            await delay(300);
          }
          if (tour.getTourFlag('boxes-checked')) {
            clickFirstElement('#root .ant-checkbox');
            await delay(300);
          }
        };
      },
    );

  return tour;
};

export const createCartDatasetDetailsTour = (
  setCurrentPage: (page: number) => void,
): JoyrideTour => {
  let cartItemsAdded = false;

  const tour = new JoyrideTour(TourTitles.CartDatasetDetails).addNextStep(
    'body',
    'This tour will guide you through the detailed information available for each dataset in your cart.',
    'center',
  );

  /* istanbul ignore if -- @preserve */
  // Add steps if the cart is empty, which will add needed items
  if (cartIsEmpty()) {
    cartItemsAdded = true;
    tour
      .addNextStep(
        'body',
        'Currently, no datasets have been added to your cart. We will need to go to the search page and add a dataset first...',
        'center',
        async (): Promise<void> => {
          await delay(300);
          setCurrentPage(AppPage.Main);
          await delay(1000);
        },
      )
      .addNextStep(
        'body',
        'This is the main search page where we will load a project to add a dataset...',
        'center',
      );
    /* istanbul ignore if -- @preserve */
    // If the main search page is empty, select a project
    if (mainTableEmpty()) {
      tour
        .addNextStep(
          leftSidebarTargets.projectSelectLeftSideBtn.selector(),
          'First we will click this button to load results from a project into the search table...',
          'right',
          () => {
            clickFirstElement(leftSidebarTargets.projectSelectLeftSideBtn.selector());
          },
        )
        .addNextStep(
          leftSidebarTargets.projectSelectLeftSideBtn.selector(),
          "NOTE: The search results may take a few seconds to load... Click 'Next' to continue.",
          'right',
          async () => {
            await delay(1000);
          },
        );
    }
    tour
      .addNextStep(
        searchTableTargets.searchResultsTable.selector(),
        "Let's go ahead and add some datasets to the cart...",
        'top-start',
        /* istanbul ignore next -- @preserve */
        async () => {
          clickFirstElement(topDataRowTargets.cartAddBtn.selector('plus'));
          await delay(500);
          clickFirstElement(topDataRowTargets.cartAddBtn.selector('plus'));
          await delay(500);
        },
      )
      .addNextStep(
        navBarTargets.cartPageBtn.selector(),
        'Now that there are datasets in the cart, we will go view them in the cart page...',
        'bottom',
        /* istanbul ignore next -- @preserve */
        async (): Promise<void> => {
          setCurrentPage(AppPage.Cart);
          await delay(1000);
        },
      );
  }

  tour.addNextStep(
    '.ant-table-container',
    'Each row in the cart represents a dataset that you have added for potential download.',
    'top-start',
  );

  // Add the data row tour steps
  addDataRowTourSteps(tour)
    .addNextStep('body', 'This concludes the cart dataset details tour.', 'center')
    .setOnFinish(
      /* istanbul ignore next -- @preserve */
      () => {
        // Clean-up step for when the tour is complete (or skipped)
        return async () => {
          if (cartItemsAdded) {
            clickFirstElement(cartTourTargets.removeItemsBtn.selector());
            await delay(500);
            clickFirstElement('.ant-popover-content .ant-btn-primary');
            await delay(300);
          }
        };
      },
    );

  return tour;
};

export const createCartDownloadOptionsTour = (
  setCurrentPage: (page: number) => void,
): JoyrideTour => {
  let cartItemsAdded = false;

  const tour = new JoyrideTour(TourTitles.CartDownloadOptions).addNextStep(
    'body',
    'This tour will guide you through the various download options available for your cart items.',
    'center',
  );

  /* istanbul ignore if -- @preserve */
  // Add steps if the cart is empty, which will add needed items
  if (cartIsEmpty()) {
    cartItemsAdded = true;
    tour
      .addNextStep(
        'body',
        'Currently, no datasets have been added to your cart. We will need to go to the search page and add a dataset first...',
        'center',
        async (): Promise<void> => {
          await delay(300);
          setCurrentPage(AppPage.Main);
          await delay(1000);
        },
      )
      .addNextStep(
        'body',
        'This is the main search page where we will load a project to add a dataset...',
        'center',
      );
    /* istanbul ignore if -- @preserve */
    // If the main search page is empty, select a project
    if (mainTableEmpty()) {
      tour
        .addNextStep(
          leftSidebarTargets.projectSelectLeftSideBtn.selector(),
          'First we will click this button to load results from a project into the search table...',
          'right',
          () => {
            clickFirstElement(leftSidebarTargets.projectSelectLeftSideBtn.selector());
          },
        )
        .addNextStep(
          leftSidebarTargets.projectSelectLeftSideBtn.selector(),
          "NOTE: The search results may take a few seconds to load... Click 'Next' to continue.",
          'right',
          async () => {
            await delay(1000);
          },
        );
    }
    tour
      .addNextStep(
        searchTableTargets.searchResultsTable.selector(),
        "Let's go ahead and add some datasets to the cart...",
        'top-start',
        /* istanbul ignore next -- @preserve */
        async () => {
          clickFirstElement(topDataRowTargets.cartAddBtn.selector('plus'));
          await delay(500);
          clickFirstElement(topDataRowTargets.cartAddBtn.selector('plus'));
          await delay(500);
        },
      )
      .addNextStep(
        navBarTargets.cartPageBtn.selector(),
        'Now that there are datasets in the cart, we will go view them in the cart page...',
        'bottom',
        /* istanbul ignore next -- @preserve */
        async (): Promise<void> => {
          setCurrentPage(AppPage.Cart);
          await delay(1000);
        },
      );
  }

  tour
    .addNextStep(
      '#root .ant-checkbox',
      'First, you need to select which datasets to download by clicking their checkboxes. You can select individual datasets or click the top checkbox to select all...',
      'top-start',
      /* istanbul ignore next -- @preserve */
      async () => {
        clickFirstElement('#root .ant-checkbox');
        // Flag that the check boxes are on
        tour.setTourFlag('boxes-checked', true);
        await delay(300);
      },
    )
    .addNextStep(
      cartTourTargets.setPreferredNodesBtn.selector(),
      'If your datasets are available from multiple data nodes, you can use the "Set Preferred Nodes" button to prioritize which nodes to download from. This helps ensure you get the fastest or most reliable downloads based on your location and preferences.',
      'bottom',
      /* istanbul ignore next -- @preserve */
      async () => {
        // Only open the modal if the button is not disabled (i.e., if nodes are available)
        const button = document.querySelector(
          cartTourTargets.setPreferredNodesBtn.selector(),
        ) as HTMLButtonElement;
        if (button && !button.disabled) {
          clickFirstElement(cartTourTargets.setPreferredNodesBtn.selector());
          await delay(500);
        }
      },
    )
    .addNextStep(
      '[data-testid="preferredNodesModalForm"]',
      'The Preferred Nodes modal lets you drag and drop data nodes to set your preferred order. When downloading, the system will use your top preference first, then fall back to the next available node if needed. Click "Apply" to save your preferences or "Cancel" to close without changes.',
      'auto',
      /* istanbul ignore next -- @preserve */
      async () => {
        // Close the modal by clicking Cancel button
        const cancelButton = document.querySelector(
          '[data-testid="preferredNodesModalForm"] [data-testid="cancelButton"]',
        ) as HTMLButtonElement;
        if (cancelButton) {
          clickFirstElement('[data-testid="preferredNodesModalForm"] [data-testid="cancelButton"]');
          await delay(300);
        }
      },
    )
    .addNextStep(
      cartTourTargets.downloadAllType.selector(),
      'This dropdown allows you to select which download method to use. The Globus download method is the default, but you can also select Wget to download all files as a script.',
      'top-start',
      /* istanbul ignore next -- @preserve */
      async () => {
        clickFirstElement(cartTourTargets.downloadAllType.selector());
        await delay(500);
      },
    );

  tour.addNextStep(
    cartTourTargets.globusCollectionDropdown.selector(),
    "For Globus downloads, you need to select a saved collection from this dropdown. If you need to add or manage collections, click the 'Manage Collections' option - when the form opens, there's a tour button available to guide you through managing collections.",
    'top-start',
  );

  tour
    .addNextStep(
      cartTourTargets.downloadTransferBtn.selector(),
      'After selecting your collection and setting your destination path, click this button to start the Globus transfer for your selected cart items.',
      'top-start',
      /* istanbul ignore next -- @preserve */
      async () => {
        clickFirstElement('#root .ant-checkbox');
        // Flag that the check boxes are off
        tour.setTourFlag('boxes-checked', false);
        await delay(300);
      },
    )
    .addNextStep('body', 'This concludes the cart download options tour.', 'center')
    .setOnFinish(
      /* istanbul ignore next -- @preserve */
      () => {
        return async () => {
          // Clean-up step for when the tour is complete (or skipped)
          if (cartItemsAdded) {
            clickFirstElement(cartTourTargets.removeItemsBtn.selector());
            await delay(500);
            clickFirstElement('.ant-popover-content .ant-btn-primary');
            await delay(300);
          }
          if (tour.getTourFlag('boxes-checked')) {
            clickFirstElement('#root .ant-checkbox');
          }
        };
      },
    );

  return tour;
};

export const createCollectionsFormTour = (): JoyrideTour => {
  const tour = new JoyrideTour(TourTitles.CartManageCollections)
    .addNextStep(
      manageCollectionsTourTargets.globusCollectionsForm.selector(),
      "The 'Manage My Collections' form allows you to search for and save Globus collections which you can then select to perform Globus transfers.",
    )
    .addNextStep(
      manageCollectionsTourTargets.searchCollectionInput.selector(),
      "First, type your search text in here, then press 'Enter' or click the blue search button to the right.",
    )
    .addNextStep(
      manageCollectionsTourTargets.globusSearchResults.selector(),
      "The search results will be displayed in this table, where you can click 'Add' for the collections you wish to save.",
      'auto',
      /* istanbul ignore next -- @preserve */
      async () => {
        clickFirstElement(manageCollectionsTourTargets.mySavedCollectionsPanel.selector());
        await delay(500);
      },
    )
    .addNextStep(
      manageCollectionsTourTargets.mySavedCollections.selector(),
      "Your currently saved collections are displayed in this table, where you can also 'Set' or 'Update' the file path to use for a specific collection. If the path is set for a specific collection, you won't have to set the path again when doing transfers to that collection.",
      'auto',
    )
    .addNextStep(
      manageCollectionsTourTargets.cancelCollectionBtn.selector(),
      "Clicking the 'Cancel' button will close this form and undo any changes you made to your saved collections. Use this if you want to discard your changes.",
      'auto',
    )
    .addNextStep(
      manageCollectionsTourTargets.saveCollectionBtn.selector(),
      "Important: You must click the 'Save' button to actually save the collections you've added or any changes you've made. Until you click Save, your changes won't be persisted.",
      'auto',
    )
    .addNextStep('body', 'This concludes the manage collections tour.', 'center')
    .setOnFinish(
      /* istanbul ignore next -- @preserve */
      () => {
        // Clean-up step for when the tour is complete (or skipped)
        return async () => {
          clickFirstElement(manageCollectionsTourTargets.mySavedCollectionsPanel.selector());
          await delay(300);
        };
      },
    );

  return tour;
};

export const createSearchCardTour = (setCurrentPage: (page: number) => void): JoyrideTour => {
  let searchSaved = false;
  const tour = new JoyrideTour(TourTitles.SavedSearches)
    .addNextStep(
      'body',
      'The search library allows you to manage previous searches that have been saved, so they can be applied in the future if desired. This tour will highlight the main features of the search library...',
      'center',
    )
    .addNextStep(
      cartTourTargets.libraryBtn.selector(),
      'Note that we are currently in the search library tab.',
    )
    .addNextStep(
      cartTourTargets.datasetBtn.selector(),
      'Clicking this would switch you to the data cart tab. We will remain on the search tab for this tour.',
    );

  // Add steps if the cart or search library is empty, which will add needed items
  /* istanbul ignore if -- @preserve */
  if (searchLibraryIsEmpty()) {
    searchSaved = true;
    tour
      .addNextStep(
        'body',
        'Currently, no searches have been saved to your library. We will need to go to the search page to save a search first...',
        'center',
        async (): Promise<void> => {
          await delay(500);
          setCurrentPage(AppPage.Main);
        },
      )
      .addNextStep(
        'body',
        'This is the main search page where we will create and save a search...',
        'center',
      );

    // If the main search page is empty, select a project
    /* istanbul ignore if -- @preserve */
    if (mainTableEmpty()) {
      tour
        .addNextStep(
          leftSidebarTargets.projectSelectLeftSideBtn.selector(),
          'First we will click this button to load results from a project into the search table...',
          'right',
          () => {
            clickFirstElement(leftSidebarTargets.projectSelectLeftSideBtn.selector());
          },
        )
        .addNextStep(
          leftSidebarTargets.projectSelectLeftSideBtn.selector(),
          "NOTE: The search results may take a few seconds to load... Click 'Next' to continue.",
          'right',
          async () => {
            if (cartIsEmpty()) {
              await delay(1000);
            }
          },
        );
    }
    tour
      .addNextStep(
        searchTableTargets.saveSearchBtn.selector(),
        'To save the current search to the library, we need to click this button...',
        'bottom-start',
        /* istanbul ignore next -- @preserve */
        async () => {
          clickFirstElement(searchTableTargets.saveSearchBtn.selector());
          await delay(500);
        },
      )
      .addNextStep(
        navBarTargets.savedSearchPageBtn.selector(),
        'We can now go back to the search library and view our recently added search...',
        'bottom',
        /* istanbul ignore next -- @preserve */
        async (): Promise<void> => {
          setCurrentPage(AppPage.SavedSearches);
          await delay(1000);
        },
      );
  }
  tour
    .addNextStep(
      cartTourTargets.cartSummary.selector(),
      "This shows a summary of all the datasets you've added and selected in the data cart. The summary is visible to both the data cart and search library.",
    )
    .addNextStep(
      savedSearchTourTargets.savedSearches.selector(),
      'Your saved searches are shown as cards in this row.',
      'bottom',
    )
    .addNextStep(
      savedSearchTourTargets.projectDescription.selector(),
      'This is the project selected for the search.',
      'top',
    )
    .addNextStep(
      savedSearchTourTargets.searchQueryString.selector(),
      'This shows the query used by the search to list results.',
    )
    .addNextStep(
      savedSearchTourTargets.applySearch.selector(),
      'Clicking this button will apply your saved search to the main results page.',
    )
    .addNextStep(
      savedSearchTourTargets.jsonBtn.selector(),
      'Clicking this button will show the JSON data associated with this search.',
      'right',
    )
    .addNextStep(
      savedSearchTourTargets.removeBtn.selector(),
      'This button will remove this search from your saved searches.',
      'left-start',
    )
    .addNextStep('body', 'This concludes the search library tour.', 'center')
    .setOnFinish(
      /* istanbul ignore next -- @preserve */
      () => {
        // Clean-up step for when the tour is complete (or skipped)
        return async () => {
          if (searchSaved) {
            clickFirstElement(savedSearchTourTargets.removeBtn.selector());
            await delay(500);
          }
        };
      },
    );

  return tour;
};

export const createNodeStatusTour = (): JoyrideTour => {
  const tour = new JoyrideTour(TourTitles.NodeStatus)
    .addNextStep(
      'body',
      'This tour will provide a brief overview of the node status page.',
      'center',
    )
    .addNextStep(
      nodeTourTargets.updateTime.selector(),
      'This is the timestamp for the last time the node status was updated.',
    )
    .addNextStep(
      nodeTourTargets.nodeStatusSummary.selector(),
      'This area provides an overall summary of the number of nodes that are available, how many are currently online and how many are currently offline.',
    )
    .addNextStep(
      nodeTourTargets.nodeColHeader.selector(),
      'This column lists the various nodes that are registered to serve the data with Metagrid. Clicking the header will toggle the sort between ascending and descending like so...',
      'top',
      /* istanbul ignore next -- @preserve */
      async () => {
        clickFirstElement(nodeTourTargets.nodeColHeader.selector());
        await delay(500);
      },
    )
    .addNextStep(
      nodeTourTargets.onlineColHeader.selector(),
      'This column shows the online status of each node. A green checkmark indicates the node is online whereas a red X mark indicates it is offline. As with the node column, you can click this to sort by node status like so...',
      'top',
      /* istanbul ignore next -- @preserve */
      async () => {
        clickFirstElement(nodeTourTargets.onlineColHeader.selector());
        await delay(700);
        clickFirstElement(nodeTourTargets.onlineColHeader.selector());
        await delay(700);
        clickFirstElement(nodeTourTargets.nodeColHeader.selector());
      },
    )
    .addNextStep(
      nodeTourTargets.sourceColHeader.selector(),
      'This column shows links to the THREDDS catalog of its respective node.',
    )
    .addNextStep('body', 'This concludes the overview of the node status page.', 'center');

  return tour;
};
