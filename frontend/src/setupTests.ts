// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom/extend-expect';

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

const localStorageMock = (() => {
  let store: { [key: string]: string } = {};

  return {
    getItem(key: string) {
      return store[key];
    },

    setItem(key: string, value: string) {
      store[key] = value;
    },

    clear() {
      store = {};
    },

    removeItem(key: string) {
      delete store[key];
    },

    getAll() {
      return store;
    },
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mocking the temp storage calls for now
// eslint-disable-next-line @typescript-eslint/no-unsafe-return
jest.mock('./api', () => ({
  ...jest.requireActual('./api'),
  loadSessionValue: jest.fn(() => Promise.resolve({ dataValue: 'test1' })),
  saveSessionValue: jest.fn(() =>
    Promise.resolve({ dataKey: 'test', dataValue: 'test1' })
  ),
}));

module.exports = window;
