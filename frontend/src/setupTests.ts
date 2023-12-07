// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom/extend-expect';
import { server } from './api/mock/server';
import messageDisplayData from './components/Messaging/messageDisplayData';
import { sessionStorageMock } from './test/jestTestFunctions';

jest.setTimeout(15000);

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

Object.defineProperty(window, 'localStorage', { value: sessionStorageMock });

beforeAll(() => server.listen());
beforeEach(() => {
  // Set start up messages as 'seen' so start popup won't show
  localStorage.setItem('lastMessageSeen', messageDisplayData.messageToShow);
});
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

module.exports = window;
