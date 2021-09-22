import { Step } from 'react-joyride';

export enum JoyrideTargetIds {
  topSearchBar = 'metagrid-top-search-bar',
  topNavBar = 'metagrid-top-nav-bar',
  leftSideBar = 'metagrid-left-side-bar',
  searchResultsTable = 'metagrid-search-results-table',
}

export const mainTour: Step[] = [
  {
    target: `#${JoyrideTargetIds.topSearchBar}`,
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
    target: `#${JoyrideTargetIds.topNavBar}`,
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
    target: `#${JoyrideTargetIds.leftSideBar}`,
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
    target: `#${JoyrideTargetIds.searchResultsTable}`,
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
