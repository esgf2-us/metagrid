export const sessionStorageMock = (() => {
  let store: { [key: string]: unknown } = {};

  return {
    getItem<T>(key: string): T {
      return store[key] as T;
    },

    setItem<T>(key: string, value: T): void {
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

export function tempStorageGetMock<T>(key: string): T {
  const value = sessionStorageMock.getItem<T>(key);
  // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
  return value;
}

export function tempStorageSetMock<T>(key: string, value: T): void {
  sessionStorageMock.setItem<T>(key, value);
}
