const localStorage = {};
const sessionStorage = {};

const storageMock = (
  initStore: Record<string, unknown>,
): {
  getItem<T>(key: string): T;
  setItem<T>(key: string, value: T): void;
  clear(): void;
  removeItem(key: string): void;
  getAll(): Record<string, unknown>;
} => {
  let store: Record<string, unknown> = initStore;
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
};

export const localStorageMock = storageMock(localStorage);
export const sessionStorageMock = storageMock(sessionStorage);

export function tempStorageGetMock<T>(key: string): T {
  const value = localStorageMock.getItem<T>(key);
  // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
  return value;
}

export function tempStorageSetMock<T>(key: string, value: T): void {
  localStorageMock.setItem<T>(key, value);
}

export function tempSessionStorageGetMock<T>(key: string): T {
  const value = sessionStorageMock.getItem<T>(key);
  // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
  return value;
}

export function tempSessionStorageSetMock<T>(key: string, value: T): void {
  sessionStorageMock.setItem<T>(key, value);
}
