import { JoyrideTour } from './JoyrideTour';
import { TourTargets } from './TourTargets';
import { AppPage } from './types';

export const getCurrentAppPage = (): number => {
  const { pathname } = window.location;
  if (pathname.endsWith('/search')) {
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
  return new Promise((res) => setTimeout(res, ms));
};

export const elementExists = (className: string): boolean => {
  return document.getElementsByClassName(className).length > 0;
};

export const elementHasState = (classname: string, state: string): boolean => {
  const elem: HTMLElement = document.getElementsByClassName(
    classname
  )[0] as HTMLElement;
  if (elem) {
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

const mainTableEmpty = (): boolean => {
  return elementExists('ant-empty-image');
};

const cartIsEmpty = (): boolean => {
  const elem = document.querySelector(
    '#root .ant-tabs-tabpane-active .ant-empty-description'
  );
  if (elem) {
    return elem.innerHTML === 'Your cart is empty';
  }
  return false;
};

const searchLibraryIsEmpty = (): boolean => {
  const elem = document.querySelector(
    '#root .ant-tabs-tabpane-active .ant-empty-description'
  );
  if (elem) {
    return elem.innerHTML === 'Your search library is empty';
  }
  return false;
};

// Object used to test, store and access the the targets used by the main tour
export const mainTourTargets = new TourTargets('main-joyride-tour')
  .create('topSearchBar')
  .create('topNavBar')
  .create('searchPageBtn')
  .create('cartPageBtn')
  .create('savedSearchPageBtn')
  .create('nodeStatusBtn')
  .create('signInBtn')
  .create('selectProjectBtn')
  .create('projectSelectLeftSideBtn')
  .create('projectWebsiteBtn')
  .create('leftSideBar')
  .create('queryString')
  .create('resultsFoundText')
  .create('searchResultsTable')
  .create('addSelectedToCartBtn')
  .create('saveSearchBtn')
  .create('copySearchLinkBtn')
  .create('cartAddBtn')
  .create('nodeStatusIcon')
  .create('datasetTitle')
  .create('fileCount')
  .create('totalSize')
  .create('versionText')
  .create('downloadScriptForm')
  .create('downloadScriptOptions')
  .create('downloadScriptBtn')
  .create('searchResultsRowExpandIcon')
  .create('searchResultsRowContractIcon')
  .create('filesTab')
  .create('metadataTab')
  .create('metadataLookupField')
  .create('citationTab')
  .create('additionalTab')
  .create('filesTitle')
  .create('dataSize')
  .create('downloadDataBtn')
  .create('copyUrlBtn')
  .create('checksum')
  .create('searchFacetsForm')
  .create('facetFormGeneral')
  .create('facetFormFields')
  .create('facetFormAdditional')
  .create('facetFormAdditionalFields')
  .create('facetFormFilename')
  .create('facetFormFilenameFields');

export const navBarTargets = new TourTargets('nav-bar-tour')
  .create('topSearchBar')
  .create('topNavBar')
  .create('searchPageBtn')
  .create('cartPageBtn')
  .create('savedSearchPageBtn')
  .create('nodeStatusBtn')
  .create('signInBtn');

export const searchTableTargets = new TourTargets('search-table-tour')
  .create('queryString')
  .create('resultsFoundText')
  .create('searchResultsTable')
  .create('addSelectedToCartBtn')
  .create('saveSearchBtn')
  .create('copySearchLinkBtn');

export const leftSidebarTargets = new TourTargets('left-sidebar-tour')
  .create('leftSideBar')
  .create('selectProjectBtn')
  .create('projectSelectLeftSideBtn')
  .create('projectWebsiteBtn')
  .create('searchFacetsForm')
  .create('facetFormGeneral')
  .create('facetFormFields')
  .create('facetFormAdditional')
  .create('facetFormAdditionalFields')
  .create('facetFormFilename')
  .create('facetFormFilenameFields');

export const topDataRowTargets = new TourTargets('top-data-row-tour')
  .create('searchResultsRowExpandIcon')
  .create('searchResultsRowContractIcon')
  .create('cartAddBtn')
  .create('nodeStatusIcon')
  .create('datasetTitle')
  .create('fileCount')
  .create('totalSize')
  .create('versionText')
  .create('downloadScriptForm')
  .create('downloadScriptOptions')
  .create('downloadScriptBtn');

export const innerDataRowTargets = new TourTargets('inner-data-row-tour')
  .create('filesTab')
  .create('metadataTab')
  .create('metadataLookupField')
  .create('citationTab')
  .create('additionalTab')
  .create('filesTitle')
  .create('dataSize')
  .create('downloadDataBtn')
  .create('copyUrlBtn')
  .create('checksum');

export const cartTourTargets = new TourTargets('cart-tour')
  .create('cartSummary')
  .create('datasetBtn')
  .create('libraryBtn')
  .create('downloadAllType')
  .create('downloadAllBtn')
  .create('removeItemsBtn');

export const savedSearchTourTargets = new TourTargets('saved-search-tour')
  .create('savedSearches')
  .create('projectDescription')
  .create('searchQueryString')
  .create('applySearch')
  .create('jsonBtn')
  .create('removeBtn');

export const nodeTourTargets = new TourTargets('node-tour')
  .create('updateTime')
  .create('nodeStatusSummary')
  .create('nodeColHeader')
  .create('onlineColHeader')
  .create('sourceColHeader');

const addDataRowTourSteps = (tour: JoyrideTour): JoyrideTour => {
  tour
    .addNextStep(
      topDataRowTargets.getSelector('datasetTitle'),
      'Each row provides access to a specific dataset. The title of the dataset is shown here.',
      'top-start'
    )
    .addNextStep(
      topDataRowTargets.getSelector('nodeStatusIcon'),
      "This icon shows the current status of the node which hosts this dataset. When hovering over the icon you will see more detail as to the node's status.",
      'top-start'
    )
    .addNextStep(
      topDataRowTargets.getSelector('fileCount'),
      'This shows how many separate files are contained in this dataset.',
      'top-start'
    )
    .addNextStep(
      topDataRowTargets.getSelector('totalSize'),
      'This shows the total size of the dataset with all of its files.',
      'top-start'
    )
    .addNextStep(
      topDataRowTargets.getSelector('versionText'),
      'The version number or preparation date is shown in this column (depending on the dataset).',
      'top-start'
    )
    .addNextStep(
      topDataRowTargets.getSelector('downloadScriptForm'),
      'If you wish to download the entire dataset, you can do so by first obtaining the download script.',
      'top-start'
    )
    .addNextStep(
      topDataRowTargets.getSelector('downloadScriptOptions'),
      'This drop-down allows you to select which type of script you wish to download. Currently wget is the only form supported.',
      'top'
    )
    .addNextStep(
      topDataRowTargets.getSelector('downloadScriptBtn'),
      'Clicking this button will begin the download of your script.',
      'top'
    )
    .addNextStep(
      topDataRowTargets.getSelector('searchResultsRowExpandIcon'),
      'To view more information about a specific dataset, you can expand the row by clicking this little arrow icon...',
      'top-start',
      async () => {
        clickFirstElement(
          topDataRowTargets.getSelector('searchResultsRowExpandIcon')
        );
        await delay(500);
      }
    )
    .addNextStep(
      innerDataRowTargets.getSelector('filesTab'),
      'The file information tab is open by default. Within this tab, it is possible to view individual files in the dataset for access and download.',
      'top-start'
    )
    .addNextStep(
      innerDataRowTargets.getSelector('filesTitle'),
      'This shows the title of a specific file contained within the dataset.',
      'top-start'
    )
    .addNextStep(
      innerDataRowTargets.getSelector('dataSize'),
      'This shows the size of the specific file in the dataset.',
      'top-start'
    )
    .addNextStep(
      innerDataRowTargets.getSelector('downloadDataBtn'),
      'Clicking this button will initiate a direct download of this data file via HTTPS.',
      'top-start'
    )
    .addNextStep(
      innerDataRowTargets.getSelector('copyUrlBtn'),
      'Clicking this button will copy the OPEN DAP URL of this file directly to your clipboard.',
      'top-start'
    )
    .addNextStep(
      innerDataRowTargets.getSelector('checksum'),
      'The checksum of the specified file is shown here.',
      'top-start'
    )
    .addNextStep(
      innerDataRowTargets.getSelector('metadataTab'),
      'This is the Metadata tab. If you click it, you can view metadata for the dataset...',
      'top-start',
      async () => {
        await delay(300);
        clickFirstElement(innerDataRowTargets.getSelector('metadataTab'));
      }
    )
    .addNextStep(
      innerDataRowTargets.getSelector('metadataLookupField'),
      'Besides seeing the metadata listed below, this field can help you search for a specific key/value pair of metadata.',
      'top-start',
      async () => {
        await delay(300);
        if (elementExists(innerDataRowTargets.getClass('citationTab'))) {
          clickFirstElement(innerDataRowTargets.getSelector('citationTab'));
        }
      }
    )
    .addNextStep(
      innerDataRowTargets.getSelector('citationTab'),
      'Citation information for the dataset can be viewed within this tab...',
      'top-start',
      async () => {
        await delay(300);
        if (elementExists(innerDataRowTargets.getClass('additionalTab'))) {
          clickFirstElement(innerDataRowTargets.getSelector('additionalTab'));
        }
      }
    )
    .addNextStep(
      innerDataRowTargets.getSelector('additionalTab'),
      'You can view additional data and sources by clicking this tab.',
      'top-start',
      async () => {
        clickFirstElement(
          topDataRowTargets.getSelector('searchResultsRowContractIcon')
        );
        await delay(300);
      }
    );

  return tour;
};

export const createMainPageTour = (): JoyrideTour => {
  const tour = new JoyrideTour('Main Search Page Tour')
    .addNextStep(
      'body',
      "Welcome to Metagrid! This tour will highlight the main controls and features of the search page. During the tour, click 'Next' to continue, or 'Previous' to go back a step in the tour. Click 'Skip' if you wish to cancel the tour. Let's begin!",
      'center'
    )
    .addNextStep(
      navBarTargets.getSelector('topSearchBar'),
      'This is the top search bar! You can select a project, then enter a search term and click the magnifying glass button to quickly start your search and view results in the table below.',
      'bottom'
    )
    .addNextStep(
      navBarTargets.getSelector('topNavBar'),
      'This area lets you navigate between pages of Metagrid.',
      'bottom'
    )
    .addNextStep(
      navBarTargets.getSelector('searchPageBtn'),
      "Clicking this button takes you to the main search page (Metagrid's home page.)",
      'bottom'
    )
    .addNextStep(
      navBarTargets.getSelector('cartPageBtn'),
      'This button takes you to the data cart page where you can view the data you have selected for download.',
      'bottom'
    )
    .addNextStep(
      navBarTargets.getSelector('savedSearchPageBtn'),
      'To view your currently saved searches, you would click here.',
      'bottom'
    )
    .addNextStep(
      navBarTargets.getSelector('nodeStatusBtn'),
      'If you are curious about data node status, you can visit the status page by clicking here.',
      'bottom'
    )
    .addNextStep(
      navBarTargets.getSelector('signInBtn'),
      'Clicking this button will allow you to sign in to your profile.',
      'bottom'
    )
    .addNextStep(
      leftSidebarTargets.getSelector('selectProjectBtn'),
      'To begin a search, you would first select a project from this drop-down.',
      'right'
    );

  if (mainTableEmpty()) {
    tour
      .addNextStep(
        leftSidebarTargets.getSelector('projectSelectLeftSideBtn'),
        'Then you click this button to load the results for the project you selected...',
        'right',
        () => {
          clickFirstElement(
            leftSidebarTargets.getSelector('projectSelectLeftSideBtn')
          );
        }
      )
      .addNextStep(
        leftSidebarTargets.getSelector('projectSelectLeftSideBtn'),
        "NOTE: The search results may take a few seconds to load... Click 'next' to continue.",
        'right',
        async () => {
          if (mainTableEmpty()) {
            await delay(1000);
          }
        }
      );
  } else {
    tour.addNextStep(
      leftSidebarTargets.getSelector('projectSelectLeftSideBtn'),
      'Then you click this button to load results for the project you selected.',
      'right'
    );
  }

  tour
    .addNextStep(
      leftSidebarTargets.getSelector('projectWebsiteBtn'),
      'Once a project is selected, if you wish, you can go view the project website by clicking this button.',
      'right'
    )
    .addNextStep(
      leftSidebarTargets.getSelector('searchFacetsForm'),
      'This area contains various groups of facets and parameters that you can use to filter results from your selected project.',
      'right'
    )
    .addNextStep(
      leftSidebarTargets.getSelector('facetFormGeneral'),
      'To filter by facets provided within this group, you would open this collapsable form by clicking on it...',
      'right-end',
      async () => {
        // Open general facets
        clickFirstElement(leftSidebarTargets.getSelector('facetFormGeneral'));
        await delay(300);
      }
    )
    .addNextStep(
      leftSidebarTargets.getSelector('facetFormFields'),
      'These are facets that are available within this group. The drop-downs allow you to select multiple items you wish to include in your search. Note that you can search for elements in the drop-down by typing within the input area.',
      'right-start',
      async () => {
        // Close general facets
        clickFirstElement(leftSidebarTargets.getSelector('facetFormGeneral'));
        await delay(300);
        // Open additional facets
        clickFirstElement(
          leftSidebarTargets.getSelector('facetFormAdditional')
        );
        await delay(500);
      }
    )
    .addNextStep(
      leftSidebarTargets.getSelector('facetFormAdditionalFields'),
      'This section contains additional properties that you can select to further refine your search results, including the Version Type, Result Type and Version Date Range. Hovering over the question mark icon will further explain the parameter.',
      'right-end',
      async () => {
        // Close additional facets
        clickFirstElement(
          leftSidebarTargets.getSelector('facetFormAdditional')
        );
        await delay(500);
        // Open filename section
        clickFirstElement(leftSidebarTargets.getSelector('facetFormFilename'));
        await delay(300);
      }
    )
    .addNextStep(
      leftSidebarTargets.getSelector('facetFormFilenameFields'),
      'This section lets you filter your results to include a specific filename. To filter by filename, you would type in the name or names as a list of comma separated values then click the magnifying glass icon to add it as a search parameter.',
      'right-end',
      () => {
        // Close filename section
        clickFirstElement(leftSidebarTargets.getSelector('facetFormFilename'));
        window.scrollTo(0, 0);
      }
    )
    .addNextStep(
      searchTableTargets.getSelector('queryString'),
      "When performing a search, you'll be able to view the resulting query generated by your selections here.",
      'bottom'
    )
    .addNextStep(
      searchTableTargets.getSelector('resultsFoundText'),
      'This will display how many results were returned from your search.',
      'bottom'
    )
    .addNextStep(
      searchTableTargets.getSelector('saveSearchBtn'),
      'If you are happy with your search results and plan to perform this search again, you can save your search by clicking this button.',
      'left'
    )
    .addNextStep(
      searchTableTargets.getSelector('copySearchLinkBtn'),
      'You can also share your search with others as a specific URL by clicking this button. The button will copy the link to your clipboard for you to then paste at your convenience.',
      'bottom-start'
    )
    .addNextStep(
      searchTableTargets.getSelector('searchResultsTable'),
      'These are your search results! Each row in the results table is a specific dataset that matches your criteria.',
      'top-start'
    )
    .addNextStep(
      '#root .ant-checkbox',
      'You can select multiple datasets using these checkboxes...',
      'top',
      async () => {
        clickFirstElement('#root .ant-checkbox');
        // Flag that the check boxes are on
        tour.setTourFlag('boxes-checked', true);
        await delay(500);
      }
    )
    .addNextStep(
      searchTableTargets.getSelector('addSelectedToCartBtn'),
      'Then to add them to your cart, you would click this button.',
      'bottom-start',
      async () => {
        clickFirstElement('#root .ant-checkbox');
        // Flag that the check boxes are on
        tour.setTourFlag('boxes-checked', false);
        await delay(500);
      }
    )
    .addNextStep(
      topDataRowTargets.getSelector('cartAddBtn', 'plus'),
      "You can also directly add a specific dataset to the cart by clicking it's plus button here.",
      'top-start'
    )
    .addNextStep(
      topDataRowTargets.getSelector('cartAddBtn', 'minus'),
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
    .setOnFinish(() => {
      return () => {
        // Clean-up step for when the tour is complete (or skipped)
        if (tour.getTourFlag('boxes-checked')) {
          clickFirstElement('#root .ant-checkbox');
        }
      };
    });

  return tour;
};

export const createCartItemsTour = (
  setCurrentPage: (page: number) => void
): JoyrideTour => {
  let cartItemsAdded = false;

  const tour = new JoyrideTour('Metagrid Data Cart Tour')
    .addNextStep(
      'body',
      'The data cart allows you to manage multiple datasets selected for bulk download. This tour will highlight the main elements of the data cart.',
      'center'
    )
    .addNextStep(
      cartTourTargets.getSelector('datasetBtn'),
      'Note that we are currently in the data cart tab.'
    )
    .addNextStep(
      cartTourTargets.getSelector('libraryBtn'),
      'Clicking this would switch you to the search library tab. However we will stay in the data cart for this tour.'
    );

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
    // If the main search page is empty, select a project
    if (mainTableEmpty()) {
      tour
        .addNextStep(
          leftSidebarTargets.getSelector('projectSelectLeftSideBtn'),
          'First we will click this button to load results from a project into the search table...',
          'right',
          () => {
            clickFirstElement(
              leftSidebarTargets.getSelector('projectSelectLeftSideBtn')
            );
          }
        )
        .addNextStep(
          leftSidebarTargets.getSelector('projectSelectLeftSideBtn'),
          "NOTE: The search results may take a few seconds to load... Click 'next' to continue.",
          'right',
          async () => {
            await delay(1000);
          }
        );
    }
    tour
      .addNextStep(
        searchTableTargets.getSelector('searchResultsTable'),
        "Let's go ahead and add some datasets to the cart...",
        'top-start',
        async () => {
          clickFirstElement(
            topDataRowTargets.getSelector('cartAddBtn', 'plus')
          );
          await delay(500);
          clickFirstElement(
            topDataRowTargets.getSelector('cartAddBtn', 'plus')
          );
          await delay(500);
        }
      )
      .addNextStep(
        navBarTargets.getSelector('cartPageBtn'),
        'Now that there are datasets in the cart, we will go view them in the cart page...',
        'bottom',
        async (): Promise<void> => {
          setCurrentPage(AppPage.Cart);
          await delay(1000);
        }
      );
  }

  tour
    .addNextStep(
      cartTourTargets.getSelector('cartSummary'),
      'This shows a summary of all the datasets in the cart. From here you can see the total datasets, files and total file size at a glance. Note: The summary is visible to both the data cart and search library.'
    )
    .addNextStep(
      '.ant-table-container',
      'This table shows the datasets that have been added to the cart.'
    )
    .addNextStep(
      topDataRowTargets.getSelector('cartAddBtn', 'minus'),
      'You can remove a dataset from the cart by clicking its minus button here.',
      'top-start'
    );

  // This will add steps to tour through elements of a dataset row
  addDataRowTourSteps(tour)
    .addNextStep(
      '#root .ant-checkbox',
      'You can select which datasets to download by clicking their checkboxes, or to select them all, click the top checkbox like so...',
      'top-start',
      async () => {
        clickFirstElement('#root .ant-checkbox');
        // Flag that the check boxes are on
        tour.setTourFlag('boxes-checked', true);
        await delay(300);
      }
    )
    .addNextStep(
      cartTourTargets.getSelector('downloadAllType'),
      'This will select which download script to use (only wget is available currently).',
      'top-start'
    )
    .addNextStep(
      cartTourTargets.getSelector('downloadAllBtn'),
      'Then you would click this button to get the download script needed for all currently selected datasets in the cart.',
      'top-start',
      async () => {
        clickFirstElement('#root .ant-checkbox');
        // Flag that the check boxes are on
        tour.setTourFlag('boxes-checked', false);
        await delay(300);
      }
    )
    .addNextStep(
      cartTourTargets.getSelector('removeItemsBtn'),
      'We can remove all items from the cart with this button.',
      'right-start'
    )
    .addNextStep('body', 'This concludes the cart page tour.', 'center')
    .setOnFinish(() => {
      // Clean-up step for when the tour is complete (or skipped)
      return async () => {
        if (cartItemsAdded) {
          clickFirstElement(cartTourTargets.getSelector('removeItemsBtn'));
          await delay(500);
          clickFirstElement('.ant-popover-buttons .ant-btn-primary');
          await delay(300);
        }
        if (tour.getTourFlag('boxes-checked')) {
          clickFirstElement('#root .ant-checkbox');
          await delay(300);
        }
      };
    });

  return tour;
};

export const createSearchCardTour = (
  setCurrentPage: (page: number) => void
): JoyrideTour => {
  let searchSaved = false;
  const tour = new JoyrideTour('Search Card Tour')
    .addNextStep(
      'body',
      'The search library allows you to manage previous searches that have been saved, so they can be applied in the future if desired. This tour will highlight the main features of the search library...',
      'center'
    )
    .addNextStep(
      cartTourTargets.getSelector('libraryBtn'),
      'Note that we are currently in the search library tab.'
    )
    .addNextStep(
      cartTourTargets.getSelector('datasetBtn'),
      'Clicking this would switch you to the data cart tab. We will remain on the search tab for this tour.'
    );

  // Add steps if the cart or search library is empty, which will add needed items
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
    if (mainTableEmpty()) {
      tour
        .addNextStep(
          leftSidebarTargets.getSelector('projectSelectLeftSideBtn'),
          'First we will click this button to load results from a project into the search table...',
          'right',
          () => {
            clickFirstElement(
              leftSidebarTargets.getSelector('projectSelectLeftSideBtn')
            );
          }
        )
        .addNextStep(
          leftSidebarTargets.getSelector('projectSelectLeftSideBtn'),
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
        searchTableTargets.getSelector('saveSearchBtn'),
        'To save the current search to the library, we need to click this button...',
        'bottom-start',
        async () => {
          clickFirstElement(searchTableTargets.getSelector('saveSearchBtn'));
          await delay(500);
        }
      )
      .addNextStep(
        navBarTargets.getSelector('savedSearchPageBtn'),
        'We can now go back to the search library and view our recently added search...',
        'bottom',
        async (): Promise<void> => {
          setCurrentPage(AppPage.SavedSearches);
          await delay(1000);
        }
      );
  }
  tour
    .addNextStep(
      cartTourTargets.getSelector('cartSummary'),
      'This shows a summary of all the datasets in the data cart. The summary is visible to both the data cart and search library.'
    )
    .addNextStep(
      savedSearchTourTargets.getSelector('savedSearches'),
      'Your saved searches are shown as cards in this row.',
      'bottom'
    )
    .addNextStep(
      savedSearchTourTargets.getSelector('projectDescription'),
      'This is the project selected for the search.',
      'top'
    )
    .addNextStep(
      savedSearchTourTargets.getSelector('searchQueryString'),
      'This shows the query used by the search to list results.'
    )
    .addNextStep(
      savedSearchTourTargets.getSelector('applySearch'),
      'Clicking this button will apply your saved search to the main results page.'
    )
    .addNextStep(
      savedSearchTourTargets.getSelector('jsonBtn'),
      'Clicking this button will show the JSON data associated with this search.',
      'right'
    )
    .addNextStep(
      savedSearchTourTargets.getSelector('removeBtn'),
      'This button will remove this search from your saved searches.',
      'left-start'
    )
    .addNextStep('body', 'This concludes the search library tour.', 'center')
    .setOnFinish(() => {
      // Clean-up step for when the tour is complete (or skipped)
      return async () => {
        if (searchSaved) {
          clickFirstElement(savedSearchTourTargets.getSelector('removeBtn'));
          await delay(500);
        }
      };
    });

  return tour;
};

export const createNodeStatusTour = (): JoyrideTour => {
  const tour = new JoyrideTour('Node Status Tour')
    .addNextStep(
      'body',
      'This tour will provide a brief overview of the node status page.',
      'center'
    )
    .addNextStep(
      nodeTourTargets.getSelector('updateTime'),
      'This is the timestamp for the last time the node status was updated.'
    )
    .addNextStep(
      nodeTourTargets.getSelector('nodeStatusSummary'),
      'This area provides an overall summary of the number of nodes that are available, how many are currently online and how many are currently offline.'
    )
    .addNextStep(
      nodeTourTargets.getSelector('nodeColHeader'),
      'This column lists the various nodes that are registered to serve the data with Metagrid. Clicking the header will toggle the sort between ascending and descending like so...',
      'top',
      async () => {
        clickFirstElement(nodeTourTargets.getSelector('nodeColHeader'));
        await delay(500);
      }
    )
    .addNextStep(
      nodeTourTargets.getSelector('onlineColHeader'),
      'This column shows the online status of each node. A green check-mark indicates the node is online whereas a red x mark indicates it is offline. As with the node column, you can click this to sort by node status like so...',
      'top',
      async () => {
        clickFirstElement(nodeTourTargets.getSelector('onlineColHeader'));
        await delay(700);
        clickFirstElement(nodeTourTargets.getSelector('onlineColHeader'));
        await delay(700);
        clickFirstElement(nodeTourTargets.getSelector('nodeColHeader'));
      }
    )
    .addNextStep(
      nodeTourTargets.getSelector('sourceColHeader'),
      'This column shows links to the THREDDS catalog of its respective node.'
    )
    .addNextStep(
      'body',
      'This concludes the overview of the node status page.',
      'center'
    );

  return tour;
};
