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

export function classSelector(className: string): string {
  return `.${className}`;
}

export const elementExists = (className: string): boolean => {
  return document.getElementsByClassName(className).length > 0;
};

export const clickFirstElement = (className: string): boolean => {
  if (elementExists(className)) {
    const elem = document
      .getElementsByClassName(className)
      .item(0) as HTMLElement;
    if (elem) {
      elem.click();
      return true;
    }
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
  .create('cartPlusBtn')
  .create('cartMinusBtn')
  .create('nodeStatusIcon')
  .create('datasetTitle')
  .create('fileCount')
  .create('totalSize')
  .create('versionText')
  .create('downloadScriptForm')
  .create('downloadScriptOptions')
  .create('downloadScriptBtn')
  .create('searchResultsRowExpandIcon')
  .create('selectedRowExpandedInfo')
  .create('filesTitle')
  .create('dataSize')
  .create('downloadDataBtn')
  .create('copyUrlBtn')
  .create('checksum')
  .create('searchFacetsForm');

export const facetTourTargets = new TourTargets('facets-form-joyride-tour')
  .create('facetForm1')
  .create('facetForm2')
  .create('facetForm3')
  .create('facetForm4')
  .create('facetForm5');

export enum CartTourTargets {
  savedSearches = 'cartPage-saved-search-items',
  cartSummary = 'cartPage-cart-summary',
  datasetBtn = 'cartPage-dataset-btn',
  searchLibraryBtn = 'cartPage-search-library-btn',
}

export enum SavedSearchTargets {
  applySearchesBtn = 'searchCard-apply-searches-btn',
  jsonBtn = 'searchCard-json-btn',
  removeSearchBtn = 'searchCard-remove-search-btn',
  projectDescription = 'searchCard-project-description',
}

export const createMainPageTour = (): JoyrideTour => {
  const tour = new JoyrideTour('Main Search Page Tour')
    .addNextStep(
      mainTourTargets.getSelector('topSearchBar'),
      'This is the top search bar! You can select a project, then enter a search term and click the magnifying glass button to quickly view results in the result table.',
      'bottom'
    )
    .addNextStep(
      mainTourTargets.getSelector('topNavBar'),
      'This area lets you navigate between pages of Metagrid.',
      'bottom'
    )
    .addNextStep(
      mainTourTargets.getSelector('searchPageBtn'),
      'Clicking this button takes you to the main search page.',
      'bottom'
    )
    .addNextStep(
      mainTourTargets.getSelector('cartPageBtn'),
      'Clicking this button takes you to the data cart page.',
      'bottom'
    )
    .addNextStep(
      mainTourTargets.getSelector('savedSearchPageBtn'),
      'Clicking this button will allow you to view your currently saved searches.',
      'bottom'
    )
    .addNextStep(
      mainTourTargets.getSelector('nodeStatusBtn'),
      'Clicking this button will take you to the data node status page.',
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

  if (elementExists('ant-empty-image')) {
    tour
      .addNextStep(
        mainTourTargets.getSelector('projectSelectLeftSideBtn'),
        'Then you click this button to load the results for the project you selected...',
        'right',
        () => {
          clickFirstElement(
            mainTourTargets.getClass('projectSelectLeftSideBtn')
          );
        }
      )
      .addNextStep(
        mainTourTargets.getSelector('projectSelectLeftSideBtn'),
        'NOTE: The search results may take a few seconds to load... Click to continue.',
        'right',
        async () => {
          if (elementExists('ant-empty-image')) {
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
      mainTourTargets.getSelector('leftSideBar'),
      'This is the left sidebar area of the app. From here you can update your search results by selecting the specific project, facets and parameters you need to narrow your search.',
      'right'
    )
    .addNextStep(
      mainTourTargets.getSelector('queryString'),
      "When performing a search, you'll be able to view the query generated for your search here.",
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
      'bottom-start'
    )
    .addNextStep(
      mainTourTargets.getSelector('cartPlusBtn'),
      "You can also directly add a specific dataset to the cart by clicking it's plus button like so...",
      'top-start',
      async () => {
        clickFirstElement(mainTourTargets.getClass('cartPlusBtn'));
        await delay(1500);
      }
    )
    .addNextStep(
      mainTourTargets.getSelector('cartMinusBtn'),
      'If you change your mind, you can remove it from the cart by clicking the minus button like so...',
      'top-start',
      async () => {
        clickFirstElement(mainTourTargets.getClass('cartMinusBtn'));
        await delay(1500);
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
      'The version number or publish date is shown in this column (depending on the dataset).',
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
          mainTourTargets.getClass('searchResultsRowExpandIcon')
        );
        await delay(700);
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
      'top-start'
    )
    .addNextStep(
      mainTourTargets.getSelector('searchFacetsForm'),
      'From here you can select various facets and parameters to filter your search further.',
      'right'
    );

  return tour;
};

export const createSearchCardTour = (): JoyrideTour => {
  return new JoyrideTour('Search Card Tour')
    .addNextStep(
      classSelector(SavedSearchTargets.projectDescription),
      'This is the project selected for this search.'
    )
    .addNextStep(
      classSelector(SavedSearchTargets.applySearchesBtn),
      'Clicking this button will apply your saved search to the main results page.'
    )
    .addNextStep(
      classSelector(SavedSearchTargets.jsonBtn),
      'Clicking this button will show the JSON data associated with this search.',
      'right'
    )
    .addNextStep(
      classSelector(SavedSearchTargets.removeSearchBtn),
      'This button will remove this search from your saved searches.',
      'left-start'
    );
};
