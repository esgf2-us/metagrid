import { mockFunction, tempStorageGetMock, tempStorageSetMock } from '../test/jestTestFunctions';
import { DataPersister } from './DataPersister';

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

describe('Test DataPersister Class', () => {
  const persistor = DataPersister.Instance;

  const persistentStore = {};

  // Initialize persistor
  persistor.initializeDataStore(persistentStore);

  const setterStore: { val: string | number } = { val: 0 };
  const loaderStore = { load: 789 };

  it('returns the DataPersistor singleton instance', () => {
    expect(persistor).toBeInstanceOf(DataPersister);

    expect(DataPersister.Instance).toBeInstanceOf(DataPersister);
  });

  it('tests addNewVar function of DataPersistor', () => {
    // Add a test variable
    persistor.addNewVar(
      'testVar',
      123,
      (val: number) => {
        setterStore.val = val;
      },
      () => {
        return new Promise((resolve) => {
          resolve(loaderStore.load);
        });
      }
    );

    // Check that variable exists and has default value
    expect(persistor.getValue('testVar')).toBeTruthy();
    expect(persistor.getValue('testVar')).toEqual(123);

    // If adding variable with same key, shouldn't do anything
    persistor.addNewVar<string>('testVar', 'test', (val: string) => {
      setterStore.val = val;
    });
    // The default value of 'test' should not exist
    expect(persistor.getValue('testVar')).not.toEqual('test');
    // The value should remain the default of 123
    expect(persistor.getValue('testVar')).toEqual(123);

    // adds a variable using a default loader function
    persistor.addNewVar<string>('testVar2', 'testVal', (val: string) => {
      setterStore.val = val;
    });
    const val = persistor.loadValue('testVar2');
    expect(val).resolves.toEqual('testVal');
  });

  it('test setValue function', async () => {
    // adds a variable using a default loader function
    persistor.addNewVar<number>('testVarSet', 123, (val: number) => {
      setterStore.val = val;
    });
    // Call setValue, with save option on
    await persistor.setValue('testVarSet', 456, true);

    // Check that testVar has set the value and called the setter function
    expect(persistor.getValue('testVarSet')).toEqual(456);
    expect(setterStore.val).toEqual(456);

    // Call setValue again but don't save
    await persistor.setValue('testVarSet', 678, false);
    expect(persistor.getValue('testVarSet')).toEqual(678);
    expect(await persistor.loadValue('testVarSet')).toEqual(456);

    // If setValue uses non-existent variable name, get should return null
    await persistor.setValue('nonExistentVar', 123, true);
    expect(persistor.getValue('nonExistentVar')).toBeNull();
  });

  it('test saveAllValues function', async () => {
    // adds some variables with default loader function
    persistor.addNewVar<number>('testVar1', 1, () => {});
    persistor.addNewVar<number>('testVar2', 2, () => {});
    persistor.addNewVar<number>('testVar3', 3, () => {});

    // Update values but don't save
    await persistor.setValue('testVar1', 10, false);
    await persistor.setValue('testVar2', 20, false);
    await persistor.setValue('testVar3', 30, false);

    // Verify that values weren't saved by loading var1
    expect(await persistor.loadValue('testVar1')).toEqual(1);

    // Now save all values
    await persistor.saveAllValues();

    // Verify updated values are now loaded with var2
    expect(await persistor.loadValue('testVar2')).toEqual(20);
  });

  it('test loadValue function', () => {
    // Original variable should load from loader
    expect(persistor.loadValue('testVar')).resolves.toEqual(loaderStore.load);

    // TestVar2 calls default load session value function
    expect(persistor.loadValue('testVar2')).resolves.toEqual('testVal');

    // Load val returns null if the variable doesn't exist
    expect(persistor.loadValue('nonVar')).resolves.toBeNull();
  });

  it('test load all values function', async () => {
    const results = await persistor.loadAllValues();
    expect(results).toEqual(undefined);
  });
});
