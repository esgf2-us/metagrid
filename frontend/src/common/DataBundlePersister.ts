import { SetterOrUpdater } from 'recoil';
import { loadSessionValue, saveSessionValue } from '../api';

type DataVar<T> = {
  key: string;
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

  addVar<T>(
    key: string,
    defaultVal: T,
    setterFunc: SetterOrUpdater<T> | undefined = undefined
  ): void {
    // Avoid overriding existing variables
    if (Object.hasOwn(this.BUNDLED_DATA_STORE, key)) {
      return;
    }

    // Create setter function
    const setter = (val: T): void => {
      this.BUNDLED_DATA_STORE[key].value = val;
      if (setterFunc) {
        setterFunc(val);
      }
    };

    // Update data store
    this.BUNDLED_DATA_STORE[key] = {
      key,
      value: defaultVal,
      setter,
    } as DataVar<unknown>;
  }

  set<T>(key: string, value: T): void {
    if (Object.hasOwn(this.BUNDLED_DATA_STORE, key)) {
      this.BUNDLED_DATA_STORE[key].setter(value);
    } else {
      this.addVar(key, value, undefined);
    }
  }

  async setAndSave<T>(key: string, value: T): Promise<void> {
    this.set<T>(key, value);
    await this.save();
  }

  get<T>(key: string): T | null {
    if (Object.hasOwn(this.BUNDLED_DATA_STORE, key)) {
      return this.BUNDLED_DATA_STORE[key].value as T;
    }
    return null;
  }

  async save(): Promise<void> {
    // Create a bundle of all the data
    const dataBundle: { [key: string]: unknown } = {};
    Object.entries(this.BUNDLED_DATA_STORE).forEach(([key, value]) => {
      dataBundle[key] = value.value;
    });

    // Save the bundle to session storage
    await saveSessionValue(DataBundlePersister.DEFAULT_KEY, JSON.stringify(dataBundle));
  }

  async load(): Promise<void> {
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
