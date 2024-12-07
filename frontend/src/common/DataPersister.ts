/* eslint-disable no-underscore-dangle */
import { SetterOrUpdater } from 'recoil';
import { loadSessionValue, saveSessionValue } from '../api';

export type PersistData<T> = {
  loader: () => Promise<T>;
  saver: () => Promise<void>;
  setter: (value: T) => void;
  value: T;
};

export class DataPersister {
  private static _instance: DataPersister;

  private _PERSISTENT_STORE: {
    [key: string]: PersistData<unknown>;
  } = {};

  private constructor() {
    this._PERSISTENT_STORE = {};
  }

  public static get Instance(): DataPersister {
    if (!this._instance) {
      this._instance = new this();
    }
    return this._instance;
  }

  initializeDataStore(dataStore: { [key: string]: PersistData<unknown> }): void {
    this._PERSISTENT_STORE = dataStore;
  }

  addNewVar<T>(
    varKey: string,
    defaultVal: T,
    setterFunc: SetterOrUpdater<T> | ((val: T) => void),
    loaderFunc?: () => Promise<T>
  ): void {
    if (Object.hasOwn(this._PERSISTENT_STORE, varKey)) {
      return;
    }

    const loader = async (): Promise<T> => {
      let val: T | null = null;
      if (loaderFunc) {
        val = await loaderFunc();
      } else {
        val = await loadSessionValue<T>(varKey);
      }

      this._PERSISTENT_STORE[varKey].value = val || defaultVal;
      setterFunc(val || defaultVal);

      return val || defaultVal;
    };

    const saver = async (): Promise<void> => {
      await saveSessionValue<T>(varKey, this._PERSISTENT_STORE[varKey].value as T);
    };

    const setter = (val: T): void => {
      this._PERSISTENT_STORE[varKey].value = val;
      setterFunc(val);
    };

    const newVar = { loader, saver, setter, value: defaultVal };
    this._PERSISTENT_STORE[varKey] = newVar as PersistData<unknown>;
  }

  getValue<T>(varKey: string): T | null {
    if (this._PERSISTENT_STORE[varKey]) {
      return this._PERSISTENT_STORE[varKey].value as T;
    }
    return null;
  }

  async loadValue<T>(varKey: string): Promise<T | null> {
    if (this._PERSISTENT_STORE[varKey]) {
      return this._PERSISTENT_STORE[varKey].loader() as Promise<T>;
    }
    return null;
  }

  async setValue<T>(varKey: string, value: T, save: boolean): Promise<void> {
    if (this._PERSISTENT_STORE[varKey]) {
      this._PERSISTENT_STORE[varKey].setter(value);

      if (save) {
        await this._PERSISTENT_STORE[varKey].saver();
      }
    }
  }

  async loadAllValues(): Promise<void> {
    const loadFuncs: Promise<unknown>[] = [];
    Object.values(this._PERSISTENT_STORE).forEach((persistVar) => {
      loadFuncs.push(persistVar.loader());
    });

    await Promise.all(loadFuncs);
  }

  async saveAllValues(): Promise<void> {
    const saveFuncs: Promise<void>[] = [];
    Object.values(this._PERSISTENT_STORE).forEach((persistVar) => {
      saveFuncs.push(persistVar.saver());
    });

    await Promise.all(saveFuncs);
  }
}
