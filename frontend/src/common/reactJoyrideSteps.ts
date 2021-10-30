import { Step } from 'react-joyride';

export enum SearchPageTargetIds {
  topSearchBar = 'searchPage-top-search-bar',
  topNavBar = 'searchPage-top-nav-bar',
  leftSideBar = 'searchPage-left-side-bar',
  searchResultsTable = 'searchPage-search-results-table',
}

export enum CartPageTargetIds {
  savedSearches = 'cartPage-saved-search-items',
  cartSummary = 'cartPage-cart-summary',
  datasetBtn = 'cartPage-dataset-btn',
  searchLibraryBtn = 'cartPage-search-library-btn',
}

export enum SearchCardTargetIds {
  applySearchesBtn = 'searchCard-apply-searches-btn',
  jsonBtn = 'searchCard-json-btn',
  removeSearchBtn = 'searchCard-remove-search-btn',
  projectDescription = 'searchCard-project-description',
}

export const mainTourUnloadedTable: Step[] = [
  {
    target: `#${SearchPageTargetIds.topSearchBar}`,
    content: 'This is the top search bar!',
    disableBeacon: true,
    placement: 'bottom',
    styles: {
      options: {
        zIndex: 10000,
      },
    },
  },
  {
    target: `#${SearchPageTargetIds.topNavBar}`,
    content: 'This is the top navigation bar!',
    disableBeacon: true,
    placement: 'bottom',
    styles: {
      options: {
        zIndex: 10000,
      },
    },
  },
  {
    target: `#${SearchPageTargetIds.leftSideBar}`,
    content: 'This is the left side bar!',
    disableBeacon: true,
    placement: 'right',
    styles: {
      options: {
        zIndex: 10000,
      },
    },
  },
  {
    target: `#${SearchPageTargetIds.searchResultsTable}`,
    content:
      'This is the main results table! It is currently empty because no project is loaded.',
    disableBeacon: true,
    placement: 'left-start',
    styles: {
      options: {
        zIndex: 10000,
      },
    },
  },
];

export const mainTourLoadedTable: Step[] = [
  {
    target: `#${SearchPageTargetIds.topSearchBar}`,
    content: 'This is the top search bar!',
    disableBeacon: true,
    placement: 'bottom',
    styles: {
      options: {
        zIndex: 10000,
      },
    },
  },
  {
    target: `#${SearchPageTargetIds.topNavBar}`,
    content: 'This is the top navigation bar!',
    disableBeacon: true,
    placement: 'bottom',
    styles: {
      options: {
        zIndex: 10000,
      },
    },
  },
  {
    target: `#${SearchPageTargetIds.leftSideBar}`,
    content: 'This is the left bar!',
    disableBeacon: true,
    placement: 'right',
    styles: {
      options: {
        zIndex: 10000,
      },
    },
  },
  {
    target: `#${SearchPageTargetIds.searchResultsTable}`,
    content: 'This is the main results table!',
    disableBeacon: true,
    placement: 'left-start',
    styles: {
      options: {
        zIndex: 10000,
      },
    },
  },
];

export const searchCardTour: Step[] = [
  {
    target: `.${SearchCardTargetIds.projectDescription}`,
    content: 'This is the project description!',
    disableBeacon: true,
    placement: 'bottom',
    styles: {
      options: {
        zIndex: 10000,
      },
    },
  },
  {
    target: `.${SearchCardTargetIds.applySearchesBtn}`,
    content: 'This is the apply button!',
    disableBeacon: true,
    placement: 'bottom',
    styles: {
      options: {
        zIndex: 10000,
      },
    },
  },
  {
    target: `.${SearchCardTargetIds.jsonBtn}`,
    content: 'This is the JSON btn!',
    disableBeacon: true,
    placement: 'right',
    styles: {
      options: {
        zIndex: 10000,
      },
    },
  },
  {
    target: `.${SearchCardTargetIds.removeSearchBtn}`,
    content: 'This is the remove btn.',
    disableBeacon: true,
    placement: 'left-start',
    styles: {
      options: {
        zIndex: 10000,
      },
    },
  },
];
