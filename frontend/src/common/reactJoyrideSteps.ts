import { globusEnabledNodes } from '../env';
import { JoyrideTour } from './JoyrideTour';
import { TargetObject } from './TargetObject';
import { AppPage } from './types';

export const getCurrentAppPage = (): number => {
  const { pathname } = window.location;
  if (pathname.endsWith('/search') || pathname.includes('/search/')) {
    return AppPage.Main;
  }
  if (pathname.endsWith('/cart/items')) {
    return AppPage.Cart;
  }
  if (pathname.endsWith('/nodes')) {
    return AppPage.NodeStatus;
  }
  if (pathname.endsWith('/cart/searches')) {
    return AppPage.SavedSearches;
  }
  return -1;
};

export const delay = (ms: number): Promise<void> => {
  return new Promise((res) => {
    setTimeout(res, ms);
  });
};

export const elementExists = (className: string): boolean => {
  return document.getElementsByClassName(className).length > 0;
};

export const elementHasState = (classname: string, state: string): boolean => {
  const elem: HTMLElement = document.getElementsByClassName(
    classname
  )[0] as HTMLElement;
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

/* istanbul ignore next */
const mainTableEmpty = (): boolean => {
  return elementExists('ant-empty-image');
};

/* istanbul ignore next */
const cartIsEmpty = (): boolean => {
  const elem = document.querySelector(
    '#root .ant-tabs-tabpane-active .ant-empty-description'
  );
  if (elem) {
    return elem.innerHTML === 'Your cart is empty';
  }
  return false;
};

/* istanbul ignore next */
const searchLibraryIsEmpty = (): boolean => {
  const elem = document.querySelector(
    '#root .ant-tabs-tabpane-active .ant-empty-description'
  );
  if (elem) {
    return elem.innerHTML === 'Your search library is empty';
  }
  return false;
};

export const defaultTarget = new TargetObject('navbar-logo');

export const miscTargets = {
  defaultTarget,
  questionBtn: new TargetObject(),
};

export const navBarTargets = {
  topSearchBar: new TargetObject(),
  topNavBar: new TargetObject(),
  searchPageBtn: new TargetObject(),
  cartPageBtn: new TargetObject(),
  savedSearchPageBtn: new TargetObject(),
  nodeStatusBtn: new TargetObject(),
  newsBtn: new TargetObject(),
  signInBtn: new TargetObject(),
  helpBtn: new TargetObject(),
};

export const searchTableTargets = {
  queryString: new TargetObject(),
  resultsFoundText: new TargetObject(),
  searchResultsTable: new TargetObject(),
  addSelectedToCartBtn: new TargetObject(),
  saveSearchBtn: new TargetObject(),
  copySearchLinkBtn: new TargetObject(),
};

export const leftSidebarTargets = {
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
  facetFormFilename: new TargetObject(),
  facetFormFilenameFields: new TargetObject(),
};

export const topDataRowTargets = {
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

export const innerDataRowTargets = {
  filesTab: new TargetObject(),
  metadataTab: new TargetObject(),
  metadataLookupField: new TargetObject(),
  citationTab: new TargetObject(),
  additionalTab: new TargetObject(),
  filesTitle: new TargetObject(),
  dataSize: new TargetObject(),
  downloadDataBtn: new TargetObject(),
  copyUrlBtn: new TargetObject(),
  checksum: new TargetObject(),
};

export const cartTourTargets = {
  cartSummary: new TargetObject(),
  datasetBtn: new TargetObject(),
  libraryBtn: new TargetObject(),
  downloadAllType: new TargetObject(),
  downloadAllBtn: new TargetObject(),
  removeItemsBtn: new TargetObject(),
};

export const savedSearchTourTargets = {
  savedSearches: new TargetObject(),
  projectDescription: new TargetObject(),
  searchQueryString: new TargetObject(),
  applySearch: new TargetObject(),
  jsonBtn: new TargetObject(),
  removeBtn: new TargetObject(),
};

export const nodeTourTargets = {
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
  Searches = 'Saved Searches Tour',
  Node = 'Node Status Tour',
  Welcome = 'Welcome Tour',
}

const addDataRowTourSteps = (tour: JoyrideTour): JoyrideTour => {
  tour
    .addNextStep(
      topDataRowTargets.datasetTitle.selector(),
      'Each row provides access to a specific dataset. The title of the dataset is shown here.',
      'top-start'
    )
    .addNextStep(
      topDataRowTargets.nodeStatusIcon.selector(),
      "This icon shows the current status of the node which hosts this dataset. When hovering over the icon you will see more detail as to the node's status.",
      'top-start'
    )
    .addNextStep(
      topDataRowTargets.fileCount.selector(),
      'This shows how many separate files are contained in this dataset.',
      'top-start'
    )
    .addNextStep(
      topDataRowTargets.totalSize.selector(),
      'This shows the total size of the dataset with all of its files.',
      'top-start'
    )
    .addNextStep(
      topDataRowTargets.versionText.selector(),
      'The version number or preparation date is shown in this column (depending on the dataset).',
      'top-start'
    )
    .addNextStep(
      topDataRowTargets.downloadScriptForm.selector(),
      'If you wish to download the entire dataset, you can do so by first obtaining the download script.',
      'top-start'
    )
    .addNextStep(
      topDataRowTargets.downloadScriptOptions.selector(),
      'This drop-down allows you to select which type of script you wish to download. Currently wget is the only form supported.',
      'top'
    )
    .addNextStep(
      topDataRowTargets.downloadScriptBtn.selector(),
      'Clicking this button will begin the download of your script.',
      'top'
    )
    .addNextStep(
      topDataRowTargets.globusReadyStatusIcon.selector(),
      'This icon indicates whether the dataset can be transferred with Globus. A check mark means it is Globus Ready and can be transferred through Globus. When hovering over the icon you will see more detail as to what node this dataset is coming from and whether the node is Globus ready.',
      'top-start'
    )
    .addNextStep(
      topDataRowTargets.searchResultsRowExpandIcon.selector(),
      'To view more information about a specific dataset, you can expand the row by clicking this little arrow icon...',
      'top-start',
      /* istanbul ignore next */
      async () => {
        clickFirstElement(
          topDataRowTargets.searchResultsRowExpandIcon.selector()
        );
        await delay(500);
      }
    )
    .addNextStep(
      innerDataRowTargets.filesTab.selector(),
      'The file information tab is open by default. Within this tab, it is possible to view individual files in the dataset for access and download.',
      'top-start'
    )
    .addNextStep(
      innerDataRowTargets.filesTitle.selector(),
      'This shows the title of a specific file contained within the dataset.',
      'top-start'
    )
    .addNextStep(
      innerDataRowTargets.dataSize.selector(),
      'This shows the size of the specific file in the dataset.',
      'top-start'
    )
    .addNextStep(
      innerDataRowTargets.downloadDataBtn.selector(),
      'Clicking this button will initiate a direct download of this data file via HTTPS.',
      'top-start'
    )
    .addNextStep(
      innerDataRowTargets.copyUrlBtn.selector(),
      'Clicking this button will copy the OPEN DAP URL of this file directly to your clipboard.',
      'top-start'
    )
    .addNextStep(
      innerDataRowTargets.checksum.selector(),
      'The checksum of the specified file is shown here.',
      'top-start'
    )
    .addNextStep(
      innerDataRowTargets.metadataTab.selector(),
      'This is the Metadata tab. If you click it, you can view metadata for the dataset...',
      'top-start',
      /* istanbul ignore next */
      async () => {
        await delay(300);
        clickFirstElement(innerDataRowTargets.metadataTab.selector());
      }
    )
    .addNextStep(
      innerDataRowTargets.metadataLookupField.selector(),
      'Besides seeing the metadata listed below, this field can help you search for a specific key/value pair of metadata.',
      'top-start',
      /* istanbul ignore next */
      async () => {
        await delay(300);
        if (elementExists(innerDataRowTargets.citationTab.class())) {
          clickFirstElement(innerDataRowTargets.citationTab.selector());
        } else if (!elementExists(innerDataRowTargets.additionalTab.class())) {
          clickFirstElement(
            topDataRowTargets.searchResultsRowContractIcon.selector()
          );
        }
      }
    )
    .addNextStep(
      innerDataRowTargets.citationTab.selector(),
      'Citation information for the dataset can be viewed within this tab...',
      'top-start',
      /* istanbul ignore next */
      async () => {
        await delay(300);
        if (elementExists(innerDataRowTargets.additionalTab.class())) {
          clickFirstElement(innerDataRowTargets.additionalTab.selector());
        } else {
          clickFirstElement(
            topDataRowTargets.searchResultsRowContractIcon.selector()
          );
        }
      }
    )
    .addNextStep(
      innerDataRowTargets.additionalTab.selector(),
      'You can view additional data and sources by clicking this tab.',
      'top-start',
      /* istanbul ignore next */
      async () => {
        clickFirstElement(
          topDataRowTargets.searchResultsRowContractIcon.selector()
        );
        await delay(300);
      }
    );

  return tour;
};

export const welcomeTour = new JoyrideTour(TourTitles.Welcome)
  .addNextStep(
    'body',
    'Just a note: We are continually striving to improve the Metagrid user interface and make it more intuitive. However, if you ever feel stuck, please try out the interface tours. The following is a quick tour showing where you can access support.',
    'center'
  )
  .addNextStep(
    navBarTargets.helpBtn.selector(),
    'This help button will open the Metagrid support dialog, which contains interface tours (like this one) as well as helpful resources.',
    'bottom'
  )
  .addNextStep(
    miscTargets.questionBtn.selector(),
    'This question button will also open the Metagrid support dialog. Note that the tour button shown in the support dialog will be specific to the current page you are on.',
    'top-end'
  );

export const createMainPageTour = (): JoyrideTour => {
  const tour = new JoyrideTour(TourTitles.Main)
    .addNextStep(
      'body',
      "Welcome to Metagrid! This tour will highlight the main controls and features of the search page. During the tour, click 'Next' to continue, or 'Skip' if you wish to cancel the tour. Let's begin!",
      'center'
    )
    .addNextStep(
      navBarTargets.topSearchBar.selector(),
      'This is the top search bar! You can select a project, then enter a search term and click the magnifying glass button to quickly start your search and view results in the table below.',
      'bottom'
    )
    .addNextStep(
      navBarTargets.topNavBar.selector(),
      'This area lets you navigate between pages of Metagrid.',
      'bottom'
    )
    .addNextStep(
      navBarTargets.searchPageBtn.selector(),
      "Clicking this button takes you to the main search page (Metagrid's home page.)",
      'bottom'
    )
    .addNextStep(
      navBarTargets.cartPageBtn.selector(),
      'This button takes you to the data cart page where you can view the data you have selected for download.',
      'bottom'
    )
    .addNextStep(
      navBarTargets.savedSearchPageBtn.selector(),
      'To view your currently saved searches, you would click here.',
      'bottom'
    )
    .addNextStep(
      navBarTargets.nodeStatusBtn.selector(),
      'If you are curious about data node status, you can visit the status page by clicking here.',
      'bottom'
    )
    .addNextStep(
      navBarTargets.newsBtn.selector(),
      "Clicking the news button will open up the message center to the right, where you'll find important notes from the admins and developers. You can also view changelog information regarding the latest version of Metagrid",
      'bottom'
    )
    .addNextStep(
      navBarTargets.signInBtn.selector(),
      'Clicking this button will allow you to sign in to your profile.',
      'bottom'
    )
    .addNextStep(
      navBarTargets.helpBtn.selector(),
      "Clicking this 'Help' button will open the support dialog, where you can view interface tours (like this), or get links to helpful documentation.",
      'bottom'
    )
    .addNextStep(
      leftSidebarTargets.selectProjectBtn.selector(),
      'To begin a search, you would first select a project from this drop-down.',
      'right'
    );

  tour.addNextStep(
    leftSidebarTargets.projectWebsiteBtn.selector(),
    'Once a project is selected, if you wish, you can go view the project website by clicking this button.',
    'right'
  );

  // Add tour elements for globus ready filter (if globus enabled nodes has been configured)
  if (globusEnabledNodes.length > 0) {
    tour
      .addNextStep(
        leftSidebarTargets.filterByGlobusTransfer.selector(),
        'This section allows you to filter search results based on globus transfer availability. There are a set of data nodes that provide the Globus Transfer option, however not all do. You can filter to show all datasets, or only those that can be transferred via globus.',
        'right'
      )
      .addNextStep(
        leftSidebarTargets.filterByGlobusTransferAny.selector(),
        'Selecting this option will leave the filter off and allow you to see all datasets, including ones that may not have Globus transfer as an option.',
        'right'
      )
      .addNextStep(
        leftSidebarTargets.filterByGlobusTransferOnly.selector(),
        'Selecting this option will filter all datasets, so that only the ones that have Globus transfer as an option will be visible.',
        'right'
      );
  }

  tour
    .addNextStep(
      leftSidebarTargets.searchFacetsForm.selector(),
      'This area contains various groups of facets and parameters that you can use to filter results from your selected project.',
      'right'
    )
    .addNextStep(
      leftSidebarTargets.facetFormGeneral.selector(),
      'To filter by facets provided within this group, you would open this collapsable form by clicking on it...',
      'right-end',
      /* istanbul ignore next */
      async () => {
        // Open general facets
        clickFirstElement(leftSidebarTargets.facetFormGeneral.selector());
        await delay(300);
      }
    )
    .addNextStep(
      leftSidebarTargets.facetFormFields.selector(),
      'These are facets that are available within this group. The drop-downs allow you to select multiple items you wish to include in your search. Note that you can search for elements in the drop-down by typing within the input area.',
      'right-start',
      /* istanbul ignore next */
      async () => {
        // Close general facets
        clickFirstElement(leftSidebarTargets.facetFormGeneral.selector());
        await delay(300);
        // Close facet panels if more than one is open
        if (elementExists(leftSidebarTargets.facetFormCollapseAllBtn.class())) {
          clickFirstElement(
            leftSidebarTargets.facetFormCollapseAllBtn.selector()
          );
          await delay(50);
        }
      }
    )
    .addNextStep(
      leftSidebarTargets.facetFormExpandAllBtn.selector(),
      'You can quickly expand all the facet panels by clicking this button.',
      'right-end',
      /* istanbul ignore next */
      async () => {
        // Expand all facets
        clickFirstElement(leftSidebarTargets.facetFormExpandAllBtn.selector());
        await delay(300);
      }
    )
    .addNextStep(
      leftSidebarTargets.facetFormCollapseAllBtn.selector(),
      "Note that there is a scroll bar on the right when the panels don't all fit on the page. Clicking the collapse all button will close all the open facet panels.",
      'right-end',
      /* istanbul ignore next */
      async () => {
        // Open general facets
        clickFirstElement(
          leftSidebarTargets.facetFormCollapseAllBtn.selector()
        );
        await delay(300);
      }
    )
    .addNextStep(
      leftSidebarTargets.facetFormAdditionalFields.selector(),
      'This section contains additional properties that you can select to further refine your search results, including the Version Type, Result Type and Version Date Range. Hovering over the question mark icon will further explain the parameter.',
      'right-end',
      /* istanbul ignore next */
      async () => {
        // Open filename section
        clickFirstElement(leftSidebarTargets.facetFormFilename.selector());
        await delay(300);
      }
    )
    .addNextStep(
      leftSidebarTargets.facetFormFilenameFields.selector(),
      'This section lets you filter your results to include a specific filename. To filter by filename, you would type in the name or names as a list of comma separated values then click the magnifying glass icon to add it as a search parameter.',
      'right-end',
      /* istanbul ignore next */
      () => {
        // Close filename section
        clickFirstElement(leftSidebarTargets.facetFormFilename.selector());
        window.scrollTo(0, 0);
      }
    )
    .addNextStep(
      searchTableTargets.queryString.selector(),
      "When performing a search, you'll be able to view the resulting query generated by your selections here.",
      'bottom'
    )
    .addNextStep(
      searchTableTargets.resultsFoundText.selector(),
      'This will display how many results were returned from your search.',
      'bottom'
    )
    .addNextStep(
      searchTableTargets.saveSearchBtn.selector(),
      'If you are happy with your search results and plan to perform this search again, you can save your search by clicking this button.',
      'left'
    )
    .addNextStep(
      searchTableTargets.copySearchLinkBtn.selector(),
      'You can also share your search with others as a specific URL by clicking this button. The button will copy the link to your clipboard for you to then paste at your convenience.',
      'bottom-start'
    )
    .addNextStep(
      searchTableTargets.searchResultsTable.selector(),
      'These are your search results! Each row in the results table is a specific dataset that matches your criteria.',
      'top-start'
    )
    .addNextStep(
      '#root .ant-checkbox',
      'You can select multiple datasets using these checkboxes...',
      'top',
      /* istanbul ignore next */
      async () => {
        clickFirstElement('#root .ant-checkbox');
        // Flag that the check boxes are on
        tour.setTourFlag('boxes-checked', true);
        await delay(500);
      }
    )
    .addNextStep(
      searchTableTargets.addSelectedToCartBtn.selector(),
      'Then to add them to your cart, you would click this button.',
      'bottom-start',
      /* istanbul ignore next */
      async () => {
        clickFirstElement('#root .ant-checkbox');
        // Flag that the check boxes are on
        tour.setTourFlag('boxes-checked', false);
        await delay(500);
      }
    )
    .addNextStep(
      topDataRowTargets.cartAddBtn.selector('plus'),
      "You can also directly add a specific dataset to the cart by clicking it's plus button here.",
      'top-start'
    )
    .addNextStep(
      topDataRowTargets.cartAddBtn.selector('minus'),
      'Or you can remove a dataset from the cart by clicking its minus button here.',
      'top-start'
    );

  // This will add steps to tour through elements of a dataset row
  addDataRowTourSteps(tour)
    .addNextStep(
      'body',
      'This concludes the main search page tour. To get a tour of other pages in the app, or repeat this tour again, you can click the big question mark button in the lower-right corner and select the tour in the Support pop-up menu.',
      'center'
    )
    .setOnFinish(
      /* istanbul ignore next */ () => {
        return () => {
          // Clean-up step for when the tour is complete (or skipped)
          if (tour.getTourFlag('boxes-checked')) {
            clickFirstElement('#root .ant-checkbox');
          }
        };
      }
    );

  return tour;
};

export const createCartItemsTour = (
  setCurrentPage: (page: number) => void
): JoyrideTour => {
  let cartItemsAdded = false;

  const tour = new JoyrideTour(TourTitles.Cart)
    .addNextStep(
      'body',
      'The data cart allows you to manage multiple datasets selected for bulk download. This tour will highlight the main elements of the data cart.',
      'center'
    )
    .addNextStep(
      cartTourTargets.datasetBtn.selector(),
      'Note that we are currently in the data cart tab.'
    )
    .addNextStep(
      cartTourTargets.libraryBtn.selector(),
      'Clicking this would switch you to the search library tab. However we will stay in the data cart for this tour.'
    );

  /* istanbul ignore if */
  // Add steps if the cart or search library is empty, which will add needed items
  if (cartIsEmpty()) {
    cartItemsAdded = true;
    tour
      .addNextStep(
        '#root .ant-empty-img-default',
        'As you can tell, currently no datasets have been added to your cart. We will need to go to the search page and add a dataset first...',
        'top',
        async (): Promise<void> => {
          await delay(300);
          setCurrentPage(AppPage.Main);
          await delay(1000);
        }
      )
      .addNextStep(
        'body',
        'This is the main search page where we will load a project to add a dataset...',
        'center'
      );
    /* istanbul ignore if */
    // If the main search page is empty, select a project
    if (mainTableEmpty()) {
      tour
        .addNextStep(
          leftSidebarTargets.projectSelectLeftSideBtn.selector(),
          'First we will click this button to load results from a project into the search table...',
          'right',
          () => {
            clickFirstElement(
              leftSidebarTargets.projectSelectLeftSideBtn.selector()
            );
          }
        )
        .addNextStep(
          leftSidebarTargets.projectSelectLeftSideBtn.selector(),
          "NOTE: The search results may take a few seconds to load... Click 'next' to continue.",
          'right',
          async () => {
            await delay(1000);
          }
        );
    }
    tour
      .addNextStep(
        searchTableTargets.searchResultsTable.selector(),
        "Let's go ahead and add some datasets to the cart...",
        'top-start',
        /* istanbul ignore next */
        async () => {
          clickFirstElement(topDataRowTargets.cartAddBtn.selector('plus'));
          await delay(500);
          clickFirstElement(topDataRowTargets.cartAddBtn.selector('plus'));
          await delay(500);
        }
      )
      .addNextStep(
        navBarTargets.cartPageBtn.selector(),
        'Now that there are datasets in the cart, we will go view them in the cart page...',
        'bottom',
        /* istanbul ignore next */
        async (): Promise<void> => {
          setCurrentPage(AppPage.Cart);
          await delay(1000);
        }
      );
  }

  tour
    .addNextStep(
      cartTourTargets.cartSummary.selector(),
      'This shows a summary of all the datasets in the cart. From here you can see the total datasets, files and total file size at a glance. Note: The summary is visible to both the data cart and search library.'
    )
    .addNextStep(
      '.ant-table-container',
      'This table shows the datasets that have been added to the cart.'
    )
    .addNextStep(
      topDataRowTargets.cartAddBtn.selector('minus'),
      'You can remove a dataset from the cart by clicking its minus button here.',
      'top-start'
    );

  // This will add steps to tour through elements of a dataset row
  addDataRowTourSteps(tour)
    .addNextStep(
      '#root .ant-checkbox',
      'You can select which datasets to download by clicking their checkboxes, or to select them all, click the top checkbox like so...',
      'top-start',
      /* istanbul ignore next */
      async () => {
        clickFirstElement('#root .ant-checkbox');
        // Flag that the check boxes are on
        tour.setTourFlag('boxes-checked', true);
        await delay(300);
      }
    )
    .addNextStep(
      cartTourTargets.downloadAllType.selector(),
      'This will select which download script to use (only wget is available currently).',
      'top-start'
    )
    .addNextStep(
      cartTourTargets.downloadAllBtn.selector(),
      'Then you would click this button to get the download script needed for all currently selected datasets in the cart.',
      'top-start',
      /* istanbul ignore next */
      async () => {
        clickFirstElement('#root .ant-checkbox');
        // Flag that the check boxes are on
        tour.setTourFlag('boxes-checked', false);
        await delay(300);
      }
    )
    .addNextStep(
      cartTourTargets.removeItemsBtn.selector(),
      'We can remove all items from the cart with this button.',
      'right-start'
    )
    .addNextStep('body', 'This concludes the cart page tour.', 'center')
    .setOnFinish(
      /* istanbul ignore next */
      () => {
        // Clean-up step for when the tour is complete (or skipped)
        return async () => {
          if (cartItemsAdded) {
            clickFirstElement(cartTourTargets.removeItemsBtn.selector());
            await delay(500);
            clickFirstElement('.ant-popover-buttons .ant-btn-primary');
            await delay(300);
          }
          if (tour.getTourFlag('boxes-checked')) {
            clickFirstElement('#root .ant-checkbox');
            await delay(300);
          }
        };
      }
    );

  return tour;
};

export const createSearchCardTour = (
  setCurrentPage: (page: number) => void
): JoyrideTour => {
  let searchSaved = false;
  const tour = new JoyrideTour(TourTitles.Searches)
    .addNextStep(
      'body',
      'The search library allows you to manage previous searches that have been saved, so they can be applied in the future if desired. This tour will highlight the main features of the search library...',
      'center'
    )
    .addNextStep(
      cartTourTargets.libraryBtn.selector(),
      'Note that we are currently in the search library tab.'
    )
    .addNextStep(
      cartTourTargets.datasetBtn.selector(),
      'Clicking this would switch you to the data cart tab. We will remain on the search tab for this tour.'
    );

  // Add steps if the cart or search library is empty, which will add needed items
  /* istanbul ignore if */
  if (searchLibraryIsEmpty()) {
    searchSaved = true;
    tour
      .addNextStep(
        '#root .ant-tabs-tabpane-active .ant-empty-description',
        'Currently, no searches have been saved to your library. We will need to go to the search page to save a search first...',
        'top',
        async (): Promise<void> => {
          await delay(500);
          setCurrentPage(AppPage.Main);
        }
      )
      .addNextStep(
        'body',
        'This is the main search page where we will create and save a search...',
        'center'
      );

    // If the main search page is empty, select a project
    /* istanbul ignore if */
    if (mainTableEmpty()) {
      tour
        .addNextStep(
          leftSidebarTargets.projectSelectLeftSideBtn.selector(),
          'First we will click this button to load results from a project into the search table...',
          'right',
          () => {
            clickFirstElement(
              leftSidebarTargets.projectSelectLeftSideBtn.selector()
            );
          }
        )
        .addNextStep(
          leftSidebarTargets.projectSelectLeftSideBtn.selector(),
          "NOTE: The search results may take a few seconds to load... Click 'next' to continue.",
          'right',
          async () => {
            if (cartIsEmpty()) {
              await delay(1000);
            }
          }
        );
    }
    tour
      .addNextStep(
        searchTableTargets.saveSearchBtn.selector(),
        'To save the current search to the library, we need to click this button...',
        'bottom-start',
        /* istanbul ignore next */
        async () => {
          clickFirstElement(searchTableTargets.saveSearchBtn.selector());
          await delay(500);
        }
      )
      .addNextStep(
        navBarTargets.savedSearchPageBtn.selector(),
        'We can now go back to the search library and view our recently added search...',
        'bottom',
        /* istanbul ignore next */
        async (): Promise<void> => {
          setCurrentPage(AppPage.SavedSearches);
          await delay(1000);
        }
      );
  }
  tour
    .addNextStep(
      cartTourTargets.cartSummary.selector(),
      'This shows a summary of all the datasets in the data cart. The summary is visible to both the data cart and search library.'
    )
    .addNextStep(
      savedSearchTourTargets.savedSearches.selector(),
      'Your saved searches are shown as cards in this row.',
      'bottom'
    )
    .addNextStep(
      savedSearchTourTargets.projectDescription.selector(),
      'This is the project selected for the search.',
      'top'
    )
    .addNextStep(
      savedSearchTourTargets.searchQueryString.selector(),
      'This shows the query used by the search to list results.'
    )
    .addNextStep(
      savedSearchTourTargets.applySearch.selector(),
      'Clicking this button will apply your saved search to the main results page.'
    )
    .addNextStep(
      savedSearchTourTargets.jsonBtn.selector(),
      'Clicking this button will show the JSON data associated with this search.',
      'right'
    )
    .addNextStep(
      savedSearchTourTargets.removeBtn.selector(),
      'This button will remove this search from your saved searches.',
      'left-start'
    )
    .addNextStep('body', 'This concludes the search library tour.', 'center')
    .setOnFinish(
      /* istanbul ignore next */
      () => {
        // Clean-up step for when the tour is complete (or skipped)
        return async () => {
          if (searchSaved) {
            clickFirstElement(savedSearchTourTargets.removeBtn.selector());
            await delay(500);
          }
        };
      }
    );

  return tour;
};

export const createNodeStatusTour = (): JoyrideTour => {
  const tour = new JoyrideTour(TourTitles.Node)
    .addNextStep(
      'body',
      'This tour will provide a brief overview of the node status page.',
      'center'
    )
    .addNextStep(
      nodeTourTargets.updateTime.selector(),
      'This is the timestamp for the last time the node status was updated.'
    )
    .addNextStep(
      nodeTourTargets.nodeStatusSummary.selector(),
      'This area provides an overall summary of the number of nodes that are available, how many are currently online and how many are currently offline.'
    )
    .addNextStep(
      nodeTourTargets.nodeColHeader.selector(),
      'This column lists the various nodes that are registered to serve the data with Metagrid. Clicking the header will toggle the sort between ascending and descending like so...',
      'top',
      /* istanbul ignore next */
      async () => {
        clickFirstElement(nodeTourTargets.nodeColHeader.selector());
        await delay(500);
      }
    )
    .addNextStep(
      nodeTourTargets.onlineColHeader.selector(),
      'This column shows the online status of each node. A green check-mark indicates the node is online whereas a red x mark indicates it is offline. As with the node column, you can click this to sort by node status like so...',
      'top',
      /* istanbul ignore next */
      async () => {
        clickFirstElement(nodeTourTargets.onlineColHeader.selector());
        await delay(700);
        clickFirstElement(nodeTourTargets.onlineColHeader.selector());
        await delay(700);
        clickFirstElement(nodeTourTargets.nodeColHeader.selector());
      }
    )
    .addNextStep(
      nodeTourTargets.sourceColHeader.selector(),
      'This column shows links to the THREDDS catalog of its respective node.'
    )
    .addNextStep(
      'body',
      'This concludes the overview of the node status page.',
      'center'
    );

  return tour;
};
