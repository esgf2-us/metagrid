// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { TextEncoder } from 'util';
import { server } from './test/mock/server';
import messageDisplayData from './components/Messaging/messageDisplayData';
import { mockConfig, originalGlobusEnabledNodes, RecoilWrapper } from './test/jestTestFunctions';
import 'cross-fetch/polyfill';
import 'mock-match-media/jest-setup';
import { sessionStorageMock } from './test/mock/mockStorage';
import {
  activeSearchQueryAtom,
  availableFacetsAtom,
  isDarkModeAtom,
  nodeStatusAtom,
  supportModalVisibleAtom,
  userCartAtom,
  userSearchQueriesAtom,
} from './components/App/recoil/atoms';
import {
  activeSearchQueryFixture,
  parsedFacetsFixture,
  parsedNodeStatusFixture,
  userCartFixture,
  userSearchQueriesFixture,
} from './test/mock/fixtures';
import { cartDownloadIsLoadingAtom, cartItemSelectionsAtom } from './components/Cart/recoil/atoms';
import { globusSavedEndpointsAtoms, globusTaskItemsAtom } from './components/Globus/recoil/atom';
import { ActiveSearchQuery, RawSearchResults } from './components/Search/types';
import { ParsedFacets } from './components/Facets/types';
import { NodeStatusArray } from './components/NodeStatus/types';
import { UserCart, UserSearchQueries } from './components/Cart/types';
import { GlobusEndpoint, GlobusTaskItem } from './components/Globus/types';

jest.setTimeout(120000);

// Used to restore window.location after each test
const location = JSON.stringify(window.location);

Object.defineProperty(window, 'localStorage', { value: sessionStorageMock });
Object.defineProperty(window, 'METAGRID', { value: mockConfig });

globalThis.TextEncoder = TextEncoder;

beforeAll(() => {
  server.listen();

  // Initialize recoil state values
  RecoilWrapper.setAtomValue<ActiveSearchQuery>(
    activeSearchQueryAtom,
    activeSearchQueryFixture(),
    false
  );
  RecoilWrapper.setAtomValue<ParsedFacets | Record<string, unknown>>(
    availableFacetsAtom,
    parsedFacetsFixture(),
    false
  );
  RecoilWrapper.setAtomValue<NodeStatusArray>(nodeStatusAtom, parsedNodeStatusFixture(), false);
  RecoilWrapper.setAtomValue<boolean>(supportModalVisibleAtom, false, false);
  RecoilWrapper.setAtomValue<boolean>(isDarkModeAtom, false, false);

  RecoilWrapper.setAtomValue<UserCart>(userCartAtom, userCartFixture(), true);
  RecoilWrapper.setAtomValue<UserSearchQueries>(
    userSearchQueriesAtom,
    userSearchQueriesFixture(),
    true
  );
  RecoilWrapper.setAtomValue<boolean>(cartDownloadIsLoadingAtom, false, true);
  RecoilWrapper.setAtomValue<RawSearchResults>(cartItemSelectionsAtom, [], true);
  RecoilWrapper.setAtomValue<GlobusEndpoint[]>(globusSavedEndpointsAtoms, [], true);
  RecoilWrapper.setAtomValue<GlobusTaskItem[]>(globusTaskItemsAtom, [], true);
});
beforeEach(() => {
  sessionStorageMock.clear();

  // Set start up messages as 'seen' so start popup won't show
  localStorage.setItem('lastMessageSeen', messageDisplayData.messageToShow);
});
afterEach(() => {
  // Routes are already declared in the App component using BrowserRouter, so MemoryRouter does
  // not work to isolate routes in memory between tests. The only workaround is to delete window.location and restore it after each test in order to reset the URL location.
  // https://stackoverflow.com/a/54222110
  // https://stackoverflow.com/questions/59892304/cant-get-memoryrouter-to-work-with-testing-library-react

  // TypeScript complains with error TS2790: The operand of a 'delete' operator must be optional.
  // https://github.com/facebook/jest/issues/890#issuecomment-776112686
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  delete window.location;
  window.location = (JSON.parse(location) as unknown) as string & Location; // Reset location
  window.location.replace = jest.fn(); // Don't do anything with redirects
  window.location.assign = jest.fn();
  window.URL.createObjectURL = jest.fn();

  HTMLAnchorElement.prototype.click = jest.fn();

  // Reset mock values
  window.METAGRID.GLOBUS_NODES = originalGlobusEnabledNodes;

  // Clear localStorage between tests
  localStorage.clear();

  // Reset all mocks after each test
  jest.clearAllMocks();

  server.resetHandlers();

  RecoilWrapper.restoreValues();

  cleanup();
});
afterAll(() => server.close());

module.exports = window;
