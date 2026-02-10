// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
/* eslint-disable */
import '@testing-library/jest-dom';
import { vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import { TextEncoder } from 'util';
import { server } from './test/mock/server';
import messageDisplayData from './components/Messaging/messageDisplayData';
import { mockConfig, originalGlobusEnabledNodes, AtomWrapper } from './test/testFunctions';
import 'cross-fetch/polyfill';
import {
  activeSearchQueryFixture,
  parsedFacetsFixture,
  parsedNodeStatusFixture,
  userCartFixture,
  userSearchQueriesFixture,
} from './test/mock/fixtures';
import { ActiveSearchQuery, RawSearchResults } from './components/Search/types';
import { ParsedFacets, RawProject } from './components/Facets/types';
import { NodeStatusArray } from './components/NodeStatus/types';
import { UserCart, UserSearchQueries } from './components/Cart/types';
import { GlobusEndpoint, GlobusTaskItem } from './components/Globus/types';
import {
  AppStateKeys,
  availableFacetsAtom,
  nodeStatusAtom,
  supportModalVisibleAtom,
  isDarkModeAtom,
  userSearchQueriesAtom,
  cartDownloadIsLoadingAtom,
  cartItemSelectionsAtom,
  savedGlobusEndpointsAtom,
  globusTaskItemsAtom,
  activeSearchQueryAtom,
  CartStateKeys,
  GlobusStateKeys,
  userCartAtom,
  userChosenEndpointAtom,
  currentProjectAtom,
} from './common/atoms';
import { localStorageMock, sessionStorageMock } from './test/mock/mockStorage';

// Minimal matchMedia polyfill for jsdom / Vitest
if (typeof window.matchMedia === 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

// Shim jsdom getComputedStyle for pseudo-elements (Vitest/jsdom shows "Not implemented" warnings)
// Return a proxy that gracefully handles pseudo-element requests and getPropertyValue calls.
const _originalGetComputedStyle = window.getComputedStyle.bind(window);
window.getComputedStyle = (elt: Element, pseudoElt?: string | null) => {
  const style = _originalGetComputedStyle(elt);
  if (!pseudoElt) return style;
  // For pseudo elements, return a proxy that returns empty strings for properties not present
  return new Proxy(style, {
    get(target, prop) {
      if (prop === 'getPropertyValue') {
        return (name: string) => {
          try {
            return (target as any).getPropertyValue(name) || '';
          } catch (e) {
            return '';
          }
        };
      }
      return (target as any)[prop];
    },
  }) as unknown as CSSStyleDeclaration;
};

// Used to restore window.location after each test
const location = JSON.stringify(window.location);

Object.defineProperty(window, 'localStorage', { value: localStorageMock });
Object.defineProperty(window, 'sessionStorage', { value: sessionStorageMock });
Object.defineProperty(window, 'METAGRID', { value: mockConfig });

// Assign TextEncoder polyfill only if not present to avoid type conflicts
if (typeof globalThis.TextEncoder === 'undefined') {
  // work around TS mismatch between DOM and Node TextEncoder types
  (globalThis as any).TextEncoder = TextEncoder;
}

beforeAll(() => {
  server.listen();

  // Initialize jotai state values
  AtomWrapper.setAtomValue<ActiveSearchQuery>(
    activeSearchQueryAtom,
    AppStateKeys.activeSearchQuery,
    activeSearchQueryFixture(),
    false,
  );
  AtomWrapper.setAtomValue<ParsedFacets | Record<string, unknown>>(
    availableFacetsAtom,
    AppStateKeys.availableFacets,
    parsedFacetsFixture(),
    false,
  );
  AtomWrapper.setAtomValue<NodeStatusArray>(
    nodeStatusAtom,
    AppStateKeys.nodeStatus,
    parsedNodeStatusFixture(),
    false,
  );
  AtomWrapper.setAtomValue<boolean>(
    supportModalVisibleAtom,
    AppStateKeys.supportModalVisible,
    false,
    false,
  );
  AtomWrapper.setAtomValue<boolean>(isDarkModeAtom, AppStateKeys.isDarkMode, false, true);
  AtomWrapper.setAtomValue<RawProject>(
    currentProjectAtom,
    AppStateKeys.currentProject,
    {} as RawProject,
    false,
  );
  AtomWrapper.setAtomValue<UserCart>(userCartAtom, AppStateKeys.userCart, userCartFixture(), true);
  AtomWrapper.setAtomValue<UserSearchQueries>(
    userSearchQueriesAtom,
    AppStateKeys.userSearchQueries,
    userSearchQueriesFixture(),
    true,
  );
  AtomWrapper.setAtomValue<boolean>(
    cartDownloadIsLoadingAtom,
    CartStateKeys.cartDownloadIsLoading,
    false,
    true,
  );
  AtomWrapper.setAtomValue<RawSearchResults>(
    cartItemSelectionsAtom,
    CartStateKeys.cartItemSelections,
    [],
    true,
  );
  AtomWrapper.setAtomValue<GlobusEndpoint | null>(
    userChosenEndpointAtom,
    GlobusStateKeys.userChosenEndpoint,
    null,
    true,
  );
  AtomWrapper.setAtomValue<GlobusEndpoint[]>(
    savedGlobusEndpointsAtom,
    GlobusStateKeys.savedGlobusEndpoints,
    [],
    true,
  );
  AtomWrapper.setAtomValue<GlobusTaskItem[]>(
    globusTaskItemsAtom,
    GlobusStateKeys.globusTaskItems,
    [],
    true,
  );
});
beforeEach(() => {
  localStorageMock.clear();
  sessionStorageMock.clear();

  // Set start up messages as 'seen' so start popup won't show
  localStorageMock.setItem('lastMessageSeen', messageDisplayData.messageToShow);
});
afterEach(() => {
  // Routes are already declared in the App component using BrowserRouter, so MemoryRouter does
  // not work to isolate routes in memory between tests. The only workaround is to delete window.location and restore it after each test in order to reset the URL location.
  // https://stackoverflow.com/a/54222110
  // https://stackoverflow.com/questions/59892304/cant-get-memoryrouter-to-work-with-testing-library-react

  // Reset window.location (some environments disallow delete) — tolerate failures.
  try {
    // TypeScript complains with error TS2790: The operand of a 'delete' operator must be optional.
    // https://github.com/facebook/jest/issues/890#issuecomment-776112686

    // @ts-ignore
    delete (window as any).location;
    // Restore saved location (if possible)

    // @ts-ignore
    window.location = JSON.parse(location) as unknown as string & Location; // Reset location
    window.location.replace = vi.fn(); // Don't do anything with redirects
    window.location.assign = vi.fn();
  } catch (e) {
    // Fallback: try to set location.href and stub replace/assign
    try {
      const loc = JSON.parse(location);
      if (loc && loc.href) {
        window.location.href = loc.href;
      }
    } catch (ee) {
      // ignore
    }
    (window.location as any).replace = vi.fn();
    (window.location as any).assign = vi.fn();
  }
  window.URL.createObjectURL = vi.fn();

  HTMLAnchorElement.prototype.click = vi.fn();

  // Reset mock values
  window.METAGRID.GLOBUS_NODES = originalGlobusEnabledNodes;

  // Clear storage between tests
  localStorageMock.clear();
  sessionStorageMock.clear();

  // Reset all mocks after each test
  vi.clearAllMocks();

  server.resetHandlers();

  AtomWrapper.restoreValues();

  cleanup();
});
afterAll(() => server.close());

module.exports = window;
