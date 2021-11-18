import { JoyrideTour } from './JoyrideTour';
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

export const getElementByClass = (className: string): string | HTMLElement => {
  const element: HTMLElement = document.getElementsByClassName(
    className
  )[0] as HTMLElement;
  if (element) {
    return element;
  }

  return `.${className}`;
};

export const elementExists = (className: string): boolean => {
  if (getElementByClass(className) instanceof HTMLElement) {
    return true;
  }
  return false;
};

export const clickFirstElement = (className: string): boolean => {
  const element: string | HTMLElement = getElementByClass(className);
  if (element instanceof HTMLElement) {
    element.click();
    return true;
  }
  return false;
};

export const testTour = new JoyrideTour('TEST TOUR');

export const addTempStep = (fileName: string, line: number): string => {
  const stepId = `tempStep-${fileName}_${line}`;
  if (
    testTour.getSteps().some((step) => {
      return step.target === `.${stepId}`;
    })
  ) {
    return stepId;
  }
  testTour.addNextStep(
    `.${stepId}`,
    `Current App Page: ===${AppPage[getCurrentAppPage()]}===
    Target found in file: ${fileName}, line: ${line}.`,
    'top'
  );
  return stepId;
};

export enum MainPageTargets {
  topSearchBar = 'searchPage-top-search-bar',
  topNavBar = 'searchPage-top-nav-bar',
  projectSelectLeftSideBtn = 'searchPage-project-select-left-side-btn',
  leftSideBar = 'searchPage-left-side-bar',
  searchResultsTable = 'searchPage-search-results-table',
  searchResultsRowExpandIcon = 'searchPage-search-results-row-expansion-icon',
  selectProjectBtn = 'searchPage-select-project-btn',
  selectedRowExpandedInfo = 'searchPage-selected-row-expanded-info',
}

export enum CartPageTargets {
  savedSearches = 'cartPage-saved-search-items',
  cartSummary = 'cartPage-cart-summary',
  datasetBtn = 'cartPage-dataset-btn',
  searchLibraryBtn = 'cartPage-search-library-btn',
}

export enum SearchCardTargets {
  applySearchesBtn = 'searchCard-apply-searches-btn',
  jsonBtn = 'searchCard-json-btn',
  removeSearchBtn = 'searchCard-remove-search-btn',
  projectDescription = 'searchCard-project-description',
}

export const mainPageTour = (): JoyrideTour => {
  const tour = new JoyrideTour('Main Search Page Tour')
    .addNextStep(
      `#${MainPageTargets.topSearchBar}`,
      'This is the top search bar! You can select a project, then enter a search term and click the magnifying glass button to quickly view results in the result table.',
      'bottom'
    )
    .addNextStep(
      `#${MainPageTargets.topNavBar}`,
      'This area lets you navigate between pages of Metagrid. From here you can select to view your data cart, your saved searches, currently available node status information and to login to your personal profile.',
      'bottom'
    );

  if (elementExists('ant-empty-image')) {
    tour
      .addNextStep(
        getElementByClass(MainPageTargets.selectProjectBtn),
        'To begin a search, you would first select a project using this drop-down.',
        'right'
      )
      .addNextStep(
        getElementByClass(MainPageTargets.projectSelectLeftSideBtn),
        'Then you click this button to load the results for the project you selected...',
        'bottom',
        () => {
          clickFirstElement(MainPageTargets.projectSelectLeftSideBtn);
        }
      )
      .addNextStep(
        getElementByClass(MainPageTargets.projectSelectLeftSideBtn),
        'NOTE: The search results may take a few seconds to load... Click to continue.',
        'bottom',
        async () => {
          if (elementExists('ant-empty-image')) {
            await delay(1000);
          }
        }
      );
  }

  tour
    .addNextStep(
      `#${MainPageTargets.searchResultsTable}`,
      'These are your search results! Each row in the results table is a specific dataset that matches your criteria.',
      'top-start'
    )
    .addNextStep(
      getElementByClass(MainPageTargets.searchResultsRowExpandIcon),
      'To view more information about a specific dataset, you would expand the row by clicking this little arrow icon',
      'top-start',
      () => {
        clickFirstElement(MainPageTargets.searchResultsRowExpandIcon);
      }
    )
    .addNextStep(
      getElementByClass(MainPageTargets.selectedRowExpandedInfo),
      'In addition to viewing more information about a dataset, it is possible to view individual files in the dataset for access and download.',
      'top-start'
    )
    .addNextStep(
      `#${MainPageTargets.leftSideBar}`,
      'This is the search filter area. From here you can narrow your search results by selecting specific facets and parameters that will be included in your search.',
      'bottom'
    );

  return tour;
};

export const searchCardTour = (): JoyrideTour => {
  return new JoyrideTour('Search Card Tour')
    .addNextStep(
      `.${SearchCardTargets.projectDescription}`,
      'This is the project selected for this search.'
    )
    .addNextStep(
      `.${SearchCardTargets.applySearchesBtn}`,
      'Clicking this button will apply your saved search to the main results page.'
    )
    .addNextStep(
      `.${SearchCardTargets.jsonBtn}`,
      'Clicking this button will show the JSON data associated with this search.',
      'right'
    )
    .addNextStep(
      `.${SearchCardTargets.removeSearchBtn}`,
      'This button will remove this search from your saved searches.',
      'left-start'
    );
};
