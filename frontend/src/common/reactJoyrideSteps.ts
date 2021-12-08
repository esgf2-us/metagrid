import { JoyrideTour } from './JoyrideTour';
import { TourTargets } from './TourTargets';
import { AppPage } from './types';

export const getCurrentAppPage = (): number => {
  const { pathname } = window.location;
  switch (pathname) {
    case '/search':
      return AppPage.Main;
    case '/cart/items':
      return AppPage.Cart;
    case '/nodes':
      return AppPage.NodeStatus;
    case '/cart/searches':
      return AppPage.SavedSearches;
    default:
      return -1;
  }
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
  .create('selectedRowExpandedInfo')
  .create('filesTitle')
  .create('dataSize')
  .create('downloadDataBtn')
  .create('copyUrlBtn')
  .create('checksum')
  .create('searchFacetsForm')
  .create('facetFormGeneral')
  .create('facetFormFirstFacet')
  .create('facetFormAdditional')
  .create('facetFormFilename')
  .create('facetFormFilenameInput');

export const cartTourTargets = new TourTargets('cart-tour')
  .create('cartItems')
  .create('cartSummary')
  .create('datasetBtn')
  .create('libraryBtn')
  .create('removeItemsBtn');

export const savedSearchTourTargets = new TourTargets('saved-search-tour')
  .create('applySearch')
  .create('jsonBtn')
  .create('removeBtn')
  .create('projectDescription');

export const createMainPageTour = (): JoyrideTour => {
  const tour = new JoyrideTour('Main Search Page Tour')
    .addNextStep(
      'body',
      "Welcome to Metagrid! This tour will highlight the main controls and features of the search page. During the tour, click 'Next' to continue, or 'Previous' to go back a step in the tour. Click 'Skip' if you wish to cancel the tour. Let's begin!",
      'center'
    )
    .addNextStep(
      mainTourTargets.getSelector('topSearchBar'),
      'This is the top search bar! You can select a project, then enter a search term and click the magnifying glass button to quickly start your search and view results in the table below.',
      'bottom'
    )
    .addNextStep(
      mainTourTargets.getSelector('topNavBar'),
      'This area lets you navigate between pages of Metagrid.',
      'bottom'
    )
    .addNextStep(
      mainTourTargets.getSelector('searchPageBtn'),
      "Clicking this button takes you to the main search page (Metagrid's home page.)",
      'bottom'
    )
    .addNextStep(
      mainTourTargets.getSelector('cartPageBtn'),
      'This button takes you to the data cart page where you can view the data you have selected for download.',
      'bottom'
    )
    .addNextStep(
      mainTourTargets.getSelector('savedSearchPageBtn'),
      'To view your currently saved searches, you would click here.',
      'bottom'
    )
    .addNextStep(
      mainTourTargets.getSelector('nodeStatusBtn'),
      'If you are curious about data node status, you can visit the status page by clicking here.',
      'bottom'
    )
    .addNextStep(
      mainTourTargets.getSelector('signInBtn'),
      'Clicking this button will allow you to sign in to your profile.',
      'bottom'
    )
    .addNextStep(
      mainTourTargets.getSelector('selectProjectBtn'),
      'To begin a search, you would first select a project from this drop-down.',
      'right'
    );

  if (mainTableEmpty()) {
    tour
      .addNextStep(
        mainTourTargets.getSelector('projectSelectLeftSideBtn'),
        'Then you click this button to load the results for the project you selected...',
        'right',
        () => {
          clickFirstElement(
            mainTourTargets.getSelector('projectSelectLeftSideBtn')
          );
        }
      )
      .addNextStep(
        mainTourTargets.getSelector('projectSelectLeftSideBtn'),
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
      mainTourTargets.getSelector('projectSelectLeftSideBtn'),
      'Then you click this button to load results for the project you selected.',
      'right'
    );
  }

  tour
    .addNextStep(
      mainTourTargets.getSelector('projectWebsiteBtn'),
      'Once a project is selected, if you wish, you can go view the project website by clicking this button.',
      'right'
    )
    .addNextStep(
      mainTourTargets.getSelector('searchFacetsForm'),
      'This area contains various groups of facets and parameters that you can use to filter results from your selected project.',
      'right'
    )
    .addNextStep(
      mainTourTargets.getSelector('facetFormGeneral'),
      'To filter by facets provided within this group, you would open this collapsable form by clicking on it...',
      'right-end',
      () => {
        clickFirstElement(mainTourTargets.getSelector('facetFormGeneral'));
      }
    )
    .addNextStep(
      mainTourTargets.getSelector('facetFormFirstFacet'),
      'This is a specific facet available within this group. The drop-downs allow you to select multiple items you wish to include in your search. Note that you can search for elements in the drop-down by typing within the input area.',
      'left-start',
      () => {
        clickFirstElement(mainTourTargets.getSelector('facetFormAdditional'));
      }
    )
    .addNextStep(
      mainTourTargets.getSelector('facetFormAdditional'),
      'This section contains additional properties that you can select to further refine your search results, including the Version Type, Result Type and Version Date Range. Hovering over the question mark icon will further explain the parameter.',
      'left-end',
      () => {
        clickFirstElement(mainTourTargets.getSelector('facetFormFilename'));
      }
    )
    .addNextStep(
      mainTourTargets.getSelector('facetFormFilename'),
      'This section lets you filter your results to include a specific filename. For more explanation you can hover over the question mark icon to see the tooltip.',
      'left-end'
    )
    .addNextStep(
      mainTourTargets.getSelector('facetFormFilenameInput'),
      'To filter by filename, you would type in the name or names as a list of comma separated values then click the magnifying glass icon to add it as a search parameter.',
      'left-end',
      () => {
        clickFirstElement(mainTourTargets.getSelector('facetFormFilename'));
        clickFirstElement(mainTourTargets.getSelector('facetFormAdditional'));
        clickFirstElement(mainTourTargets.getSelector('facetFormGeneral'));
        window.scrollTo(0, 0);
      }
    )
    .addNextStep(
      mainTourTargets.getSelector('queryString'),
      "When performing a search, you'll be able to view the resulting query generated by your selections here.",
      'bottom'
    )
    .addNextStep(
      mainTourTargets.getSelector('resultsFoundText'),
      'This will display how many results were returned from your search.',
      'bottom'
    )
    .addNextStep(
      mainTourTargets.getSelector('saveSearchBtn'),
      'If you are happy with your search results and plan to perform this search again, you can save your search by clicking this button.',
      'left'
    )
    .addNextStep(
      mainTourTargets.getSelector('copySearchLinkBtn'),
      'You can also share your search with others as a specific URL by clicking this button. The button will copy the link to your clipboard for you to then paste at your convenience.',
      'bottom-start'
    )
    .addNextStep(
      mainTourTargets.getSelector('searchResultsTable'),
      'These are your search results! Each row in the results table is a specific dataset that matches your criteria.',
      'top-start'
    )
    .addNextStep(
      '#root .ant-checkbox',
      'You can select multiple datasets using these checkboxes...',
      'top'
    )
    .addNextStep(
      mainTourTargets.getSelector('addSelectedToCartBtn'),
      'Then to add them to your cart, you would click this button.',
      'bottom-start',
      async () => {
        if (
          elementHasState(mainTourTargets.getSelector('cartAddBtn'), 'minus')
        ) {
          clickFirstElement(mainTourTargets.getSelector('cartAddBtn'));
          await delay(300);
        }
      }
    )
    .addNextStep(
      mainTourTargets.getSelector('cartAddBtn'),
      "You can also directly add a specific dataset to the cart by clicking it's plus button like so...",
      'top-start',
      async () => {
        clickFirstElement(mainTourTargets.getSelector('cartAddBtn', 'plus'));
        await delay(300);
      }
    )
    .addNextStep(
      mainTourTargets.getSelector('cartAddBtn'),
      'If you change your mind, you can remove it from the cart by clicking the minus button like so...',
      'top-start',
      async () => {
        clickFirstElement(mainTourTargets.getSelector('cartAddBtn'));
        await delay(300);
      }
    )
    .addNextStep(
      mainTourTargets.getSelector('datasetTitle'),
      'Each row provides access to a specific dataset. The title of the dataset is shown here.',
      'top-start'
    )
    .addNextStep(
      mainTourTargets.getSelector('nodeStatusIcon'),
      "This icon shows the current status of the node which hosts this dataset. When hovering over the icon you will see more detail as to the node's status.",
      'top-start'
    )
    .addNextStep(
      mainTourTargets.getSelector('fileCount'),
      'This shows how many separate files are contained in this dataset.',
      'top-start'
    )
    .addNextStep(
      mainTourTargets.getSelector('totalSize'),
      'This shows the total size of the dataset with all of its files.',
      'top-start'
    )
    .addNextStep(
      mainTourTargets.getSelector('versionText'),
      'The version number or preparation date is shown in this column (depending on the dataset).',
      'top-start'
    )
    .addNextStep(
      mainTourTargets.getSelector('downloadScriptForm'),
      'If you wish to download the entire dataset, you can do so by first obtaining the download script.',
      'top-start'
    )
    .addNextStep(
      mainTourTargets.getSelector('downloadScriptOptions'),
      'This drop-down allows you to select which type of script you wish to download. Currently wget is the only form supported.',
      'top'
    )
    .addNextStep(
      mainTourTargets.getSelector('downloadScriptBtn'),
      'Clicking this button will begin the download of your script.',
      'top'
    )
    .addNextStep(
      mainTourTargets.getSelector('searchResultsRowExpandIcon'),
      'To view more information about a specific dataset, you can expand the row by clicking this little arrow icon...',
      'top-start',
      async () => {
        clickFirstElement(
          mainTourTargets.getSelector('searchResultsRowExpandIcon')
        );
        await delay(1000);
      }
    )
    .addNextStep(
      mainTourTargets.getSelector('selectedRowExpandedInfo'),
      'In addition to viewing more information about a dataset, it is possible to view individual files in the dataset for access and download.',
      'top-start'
    )
    .addNextStep(
      mainTourTargets.getSelector('filesTitle'),
      'This shows the title of a specific file contained within the dataset.',
      'top-start'
    )
    .addNextStep(
      mainTourTargets.getSelector('dataSize'),
      'This shows the size of the specific file in the dataset.',
      'top-start'
    )
    .addNextStep(
      mainTourTargets.getSelector('downloadDataBtn'),
      'Clicking this button will initiate a direct download of this data file via HTTPS.',
      'top-start'
    )
    .addNextStep(
      mainTourTargets.getSelector('copyUrlBtn'),
      'Clicking this button will copy the OPEN DAP URL of this file directly to your clipboard.',
      'top-start'
    )
    .addNextStep(
      mainTourTargets.getSelector('checksum'),
      'The checksum of the specified file is shown here.',
      'top-start',
      () => {
        clickFirstElement(
          mainTourTargets.getSelector('searchResultsRowContractIcon')
        );
      }
    )
    .addNextStep(
      'body',
      'This concludes the main search page tour. To get a tour of other pages in the app, or repeat this tour again, you can click the big question mark button in the lower-right corner and select the tour in the Support pop-up menu.',
      'center'
    );

  return tour;
};

export const createCartItemsTour = (
  setCurrentPage: (page: number) => void
): JoyrideTour => {
  const tour = new JoyrideTour('Metagrid Data Cart Tour').addNextStep(
    'body',
    'This tour will highlight the main elements of the Metagrid data cart.',
    'center'
  );

  let cartItemsAdded = false;

  // Add steps if the cart is empty, which will add an item
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
        }
      )
      .addNextStep(
        'body',
        'This is the main search page where we will load a project to add a dataset...',
        'center'
      );
    // If the main search page is empty, select a project
    if (cartIsEmpty()) {
      tour
        .addNextStep(
          mainTourTargets.getSelector('projectSelectLeftSideBtn'),
          'First we will click this button to load results from a project into the search table...',
          'right',
          () => {
            console.log(
              mainTourTargets.getSelector('projectSelectLeftSideBtn')
            );
            clickFirstElement(
              mainTourTargets.getSelector('projectSelectLeftSideBtn')
            );
          }
        )
        .addNextStep(
          mainTourTargets.getSelector('projectSelectLeftSideBtn'),
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
        mainTourTargets.getSelector('searchResultsTable'),
        "Let's go ahead and add some datasets to the cart...",
        'top-start',
        async () => {
          clickFirstElement(mainTourTargets.getSelector('cartAddBtn', 'plus'));
          await delay(300);
          clickFirstElement(mainTourTargets.getSelector('cartAddBtn', 'plus'));
          await delay(300);
        }
      )
      .addNextStep(
        mainTourTargets.getSelector('cartPageBtn'),
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
      'This shows a summary of the datasets in the cart.'
    )
    .addNextStep(
      '.ant-table-container',
      'This table shows the current datasets in the cart.'
    )
    .addNextStep(
      cartTourTargets.getSelector('removeItemsBtn'),
      'We can remove all items from the cart with this button.',
      'right-start',
      async () => {
        if (cartItemsAdded) {
          clickFirstElement(cartTourTargets.getSelector('removeItemsBtn'));
          await delay(500);
          clickFirstElement('.ant-popover-buttons .ant-btn-primary');
          await delay(300);
        }
      }
    );

  tour.addNextStep('body', 'This concludes the cart page tour.', 'center');

  return tour;
};

export const createSearchCardTour = (): JoyrideTour => {
  const searchCardTour = new JoyrideTour('Search Card Tour');

  searchCardTour
    .addNextStep(
      savedSearchTourTargets.getSelector('projectDescription'),
      'This is the project selected for this search.'
    )
    .addNextStep(
      savedSearchTourTargets.getSelector('applyBtn'),
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
    );

  return searchCardTour;
};
