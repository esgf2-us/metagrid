// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { server } from './test/mock/server';
import messageDisplayData from './components/Messaging/messageDisplayData';
import {
  mockConfig,
  originalGlobusEnabledNodes,
  sessionStorageMock,
} from './test/jestTestFunctions';

jest.setTimeout(35000);

// Fixes 'TypeError: Cannot read property 'addListener' of undefined.
// https://github.com/AO19/typeError-cannot-read-property-addListener-of-undefined/commit/873ce9b730a1c21b40c9264e5f29fc2df436136b
global.matchMedia =
  global.matchMedia ||
  // eslint-disable-next-line func-names
  function () {
    return {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    };
  };

// Used to restore window.location after each test
const location = JSON.stringify(window.location);

Object.defineProperty(window, 'localStorage', { value: sessionStorageMock });
Object.defineProperty(window, 'METAGRID', { value: mockConfig });

beforeAll(() => {
  server.listen();
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
  window.location = (JSON.parse(location) as unknown) as Location; // Reset location
  window.location.replace = jest.fn(); // Don't do anything with redirects
  window.location.assign = jest.fn();
  window.URL.createObjectURL = jest.fn();

  HTMLAnchorElement.prototype.click = jest.fn();

  // Reset mock values
  window.METAGRID.REACT_APP_GLOBUS_NODES = originalGlobusEnabledNodes;

  // Clear localStorage between tests
  localStorage.clear();

  // Reset all mocks after each test
  jest.clearAllMocks();

  server.resetHandlers();

  cleanup();
});
afterAll(() => server.close());

module.exports = window;
