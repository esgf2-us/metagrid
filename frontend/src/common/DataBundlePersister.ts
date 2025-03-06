import { SetterOrUpdater } from 'recoil';
import { loadSessionValue, saveSessionValue } from '../api';

type DataVar<T> = {
  value: T;
  setter: (value: T) => void;
};

export default class DataBundlePersister {
  private static instance: DataBundlePersister;

  private BUNDLED_DATA_STORE: {
    [key: string]: DataVar<unknown>;
  } = {};

  private constructor() {
    this.BUNDLED_DATA_STORE = {};
  }

  public static readonly DEFAULT_KEY = 'dataBundleBlob';

  public static get Instance(): DataBundlePersister {
    if (!this.instance) {
      this.instance = new this();
    }
    return this.instance;
  }

  initializeDataStore(dataStore: { [key: string]: DataVar<unknown> }): void {
    this.BUNDLED_DATA_STORE = dataStore;
  }

  peekAtDataStore(): { [key: string]: DataVar<unknown> } {
    return this.BUNDLED_DATA_STORE;
  }

  addVar<T>(
    key: string,
    defaultVal: T,
    setterFunc: SetterOrUpdater<T> | undefined = undefined
  ): void {
    // Create setter function
    const setter = (newValue: T): void => {
      // Update the value only if it is different from the previous value
      // This is to avoid calling the setter function multiple times
      const currentValue = this.BUNDLED_DATA_STORE[key].value;
      if (currentValue !== newValue) {
        this.BUNDLED_DATA_STORE[key].value = newValue;
        if (setterFunc) {
          setterFunc(newValue);
        }
      }
    };

    let valueToSet: T = defaultVal;
    if (Object.hasOwn(this.BUNDLED_DATA_STORE, key)) {
      valueToSet = this.BUNDLED_DATA_STORE[key].value as T;
    }

    // Update data store if the key does not exist
    this.BUNDLED_DATA_STORE[key] = {
      value: valueToSet,
      setter,
    } as DataVar<unknown>;
  }

  set<T>(key: string, value: T): void {
    if (Object.hasOwn(this.BUNDLED_DATA_STORE, key)) {
      this.BUNDLED_DATA_STORE[key].setter(value);
    } else {
      this.addVar(key, value);
    }
  }

  async setAndSave<T>(key: string, value: T): Promise<void> {
    this.set<T>(key, value);
    await this.saveAll();
  }

  get<T>(key: string, defaultVal: T): T {
    if (Object.hasOwn(this.BUNDLED_DATA_STORE, key)) {
      return this.BUNDLED_DATA_STORE[key].value as T;
    }
    return defaultVal;
  }

  async saveAll(): Promise<void> {
    if (Object.keys(this.BUNDLED_DATA_STORE).length === 0) {
      return;
    }

    // Create a bundle of all the data
    const dataBundle: { [key: string]: unknown } = {};
    Object.entries(this.BUNDLED_DATA_STORE).forEach(([key, value]) => {
      dataBundle[key] = value.value;
    });

    // Save the bundle to session storage
    await saveSessionValue(DataBundlePersister.DEFAULT_KEY, JSON.stringify(dataBundle));
  }

  async loadAll(): Promise<void> {
    // console.info('Loading data bundle...');
    // Load the bundle from session storage
    const loadedJSON: string | null = await loadSessionValue<string>(
      DataBundlePersister.DEFAULT_KEY
    );

    // Parse the loaded JSON
    const dataBundle = loadedJSON
      ? (JSON.parse(loadedJSON) as { [key: string]: DataVar<unknown> })
      : null;

    if (dataBundle) {
      // Update the data store with the parsed values
      Object.entries(dataBundle).forEach(([key, value]) => {
        this.set(key, value);
      });
    }
  }
}
