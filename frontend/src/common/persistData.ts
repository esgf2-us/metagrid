import { SetterOrUpdater } from 'recoil';
import { loadSessionValue, saveSessionValue } from '../api';

export type PersistentVar<T> = {
  loader: () => Promise<T>;
  saver: () => Promise<void>;
  getter: () => T;
  setter: (value: T) => void;
  value: T;
};

const PERSISTENT_VARS: {
  [key: string]: PersistentVar<unknown>;
} = {};

export function addPersistVar<T>(
  varKey: string,
  defaultVal: T,
  setterFunc: SetterOrUpdater<T>,
  loaderFunc?: () => Promise<T>
): void {
  if (Object.hasOwn(PERSISTENT_VARS, varKey)) {
    return;
  }

  const loader = async (): Promise<T> => {
    let val: T | null = null;
    if (loaderFunc) {
      val = await loaderFunc();
    } else {
      val = await loadSessionValue<T>(varKey);
    }

    if (PERSISTENT_VARS[varKey]) {
      PERSISTENT_VARS[varKey].value = val || defaultVal;
      setterFunc(val || defaultVal);
    }
    return val || defaultVal;
  };

  const saver = async (): Promise<void> => {
    if (PERSISTENT_VARS[varKey]) {
      await saveSessionValue<T>(varKey, PERSISTENT_VARS[varKey].value as T);
    } else {
      await saveSessionValue<T>(varKey, defaultVal);
    }
  };

  const setter = (val: T): void => {
    if (PERSISTENT_VARS[varKey]) {
      PERSISTENT_VARS[varKey].value = val;
      setterFunc(val);
    }
  };

  const getter = (): T => {
    if (PERSISTENT_VARS[varKey]) {
      return PERSISTENT_VARS[varKey].value as T;
    }
    return defaultVal;
  };

  const newVar = { loader, saver, getter, setter, value: defaultVal };
  PERSISTENT_VARS[varKey] = newVar as PersistentVar<unknown>;
}

export function getPersistVal<T>(varKey: string): T | null {
  if (PERSISTENT_VARS[varKey]) {
    return PERSISTENT_VARS[varKey].value as T;
  }
  return null;
}

export async function loadPersistVal<T>(varKey: string): Promise<T | null> {
  if (PERSISTENT_VARS[varKey]) {
    return PERSISTENT_VARS[varKey].loader() as Promise<T>;
  }
  return null;
}

export async function setPersistVal<T>(
  varKey: string,
  value: T,
  save: boolean
): Promise<void> {
  if (PERSISTENT_VARS[varKey]) {
    PERSISTENT_VARS[varKey].setter(value);

    if (save) {
      await PERSISTENT_VARS[varKey].saver();
    }
  }
}

export async function loadAllPersistVals(): Promise<void> {
  const loadFuncs: Promise<unknown>[] = [];
  Object.values(PERSISTENT_VARS).forEach((persistVar) => {
    if (persistVar && persistVar.loader) {
      loadFuncs.push(persistVar.loader());
    }
  });

  await Promise.all(loadFuncs);
}

export async function saveAllPersistVals(): Promise<void> {
  const saveFuncs: Promise<void>[] = [];
  Object.values(PERSISTENT_VARS).forEach((persistVar) => {
    if (persistVar && persistVar.saver) {
      saveFuncs.push(persistVar.saver());
    }
  });

  await Promise.all(saveFuncs);
}
