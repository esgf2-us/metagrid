import { mockFunction } from '../test/jestTestFunctions';
import { tempStorageGetMock, tempStorageSetMock } from '../test/mock/mockStorage';
import DataBundlePersister from './DataBundlePersister';

const mockLoadValue = mockFunction((key: unknown) => {
  return Promise.resolve(tempStorageGetMock(key as string));
});

const mockSaveValue = mockFunction((key: unknown, value: unknown) => {
  tempStorageSetMock(key as string, value);
  return Promise.resolve({
    msg: 'Updated temporary storage.',
    data_key: key,
  });
});

jest.mock('../api/index', () => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const originalModule = jest.requireActual('../api/index');

  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return {
    __esModule: true,
    ...originalModule,
    loadSessionValue: (key: string) => {
      return mockLoadValue(key);
    },
    saveSessionValue: (key: string, value: unknown) => {
      return mockSaveValue(key, value);
    },
  };
});

describe('DataBundlePersister', () => {
  const db = DataBundlePersister.Instance;

  beforeEach(() => {
    // Reset the mock storage before each test
    db.initializeDataStore({});
  });

  it('returns the DataPersistor singleton instance', () => {
    expect(db).toBeInstanceOf(DataBundlePersister);
    expect(DataBundlePersister.Instance).toBeInstanceOf(DataBundlePersister);
  });

  it('should add a new variable', () => {
    const key = 'testKey';
    const value = 'testValue';
    db.addVar(key, value);

    expect(db.get(key, null)).toBe(value);
  });

  it('should set and get a variable', () => {
    const key = 'testKey';
    const value = 'testValue';
    db.set(key, value);

    expect(db.get(key, null)).toBe(value);
  });

  it('should save and load data', async () => {
    const key = 'testKey';
    const value = 'testValue';
    db.set(key, value);

    await db.saveAll();
    // Flush persistor to simulate a redirect
    db.initializeDataStore({});
    expect(db.get(key, null)).toBe(null);

    await db.loadAll();
    expect(db.get(key, null)).toBe(value);
  });

  it('should set and save a variable', async () => {
    const key = 'testKey';
    const value = 'testValue';
    await db.setAndSave(key, value);

    expect(db.get(key, null)).toBe(value);

    // Flush persistor to simulate a redirect
    db.initializeDataStore({});
    expect(db.get(key, null)).toBe(null);

    await db.loadAll();
    expect(db.get(key, null)).toBe(value);
  });

  it('should initialize data store', () => {
    const dataStore = {
      testKey: {
        key: 'testKey',
        value: 'testValue',
        setter: jest.fn(),
      },
    };
    db.initializeDataStore(dataStore);

    expect(db.get('testKey', null)).toBe('testValue');
  });

  it('should not update the value if it is the same as the current value', () => {
    const key = 'testKey';
    const value = 'testValue';
    const setterFunc = jest.fn();
    db.addVar(key, value, setterFunc);

    db.set(key, value);

    expect(setterFunc).not.toHaveBeenCalled();
  });

  it('should handle non-existent keys gracefully', () => {
    const key = 'nonExistentKey';
    const defaultValue = 'defaultValue';

    expect(db.get(key, defaultValue)).toBe(defaultValue);
  });

  it('should handle loading from an empty session storage', async () => {
    tempStorageSetMock(DataBundlePersister.DEFAULT_KEY, null);
    await db.loadAll();

    expect(Object.keys(db.peekAtDataStore()).length).toBe(0);
  });

  it('should handle saving when data store is empty', async () => {
    await expect(db.saveAll()).resolves.not.toThrow();
  });

  it('should update the value if it is different from the current value', () => {
    const key = 'testKey';
    const initialValue = 'initialValue';
    const newValue = 'newValue';
    db.addVar(key, initialValue);

    const setterSpy = jest.spyOn(db.peekAtDataStore()[key], 'setter');
    db.set(key, newValue);

    expect(setterSpy).toHaveBeenCalledWith(newValue);
    expect(db.get(key, null)).toBe(newValue);
  });

  it('should handle adding a variable with an existing key', () => {
    const key = 'testKey';
    const initialValue = 'initialValue';
    const newValue = 'newValue';
    db.addVar(key, initialValue);
    db.addVar(key, newValue);

    expect(db.get(key, null)).toBe(initialValue);
  });

  it('should handle adding a variable with a setter function', () => {
    const key = 'testKey';
    const value = 'testValue';
    const setterFunc = jest.fn();
    db.addVar(key, value, setterFunc);

    expect(db.get(key, null)).toBe(value);

    db.set(key, 'newValue');
    expect(db.get(key, null)).toBe('newValue');
  });
});
