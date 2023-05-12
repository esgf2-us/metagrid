import { atom, DefaultValue } from 'recoil';
import { loadSessionValue, saveSessionValue } from '../../../api';
import { GlobusStateValue } from '../../../common/types';

// Folder structure based on: https://wes-rast.medium.com/recoil-project-structure-best-practices-79e74a475caa

enum GlobusStateKeys {
  accessToken = 'globusAccessToken',
  continueGlobusPrepSteps = 'continueGlobusPreparationSteps',
  useDefaultEndpoint = 'useDefaultEndpoint',
  defaultEndpoint = 'defaultGlobusEndpoint',
  userSelectedEndpoint = 'userSelectedEndpoint',
  refreshToken = 'globusRefreshToken',
  tokenResponse = 'tokenResponse',
  transferToken = 'globusTransferToken',
}

export const sessionStorageEffect = (key: string) => ({
  setSelf,
  onSet,
  trigger,
}: {
  setSelf: (value: GlobusStateValue | DefaultValue) => void;
  onSet: (
    func: (
      newValue: GlobusStateValue | DefaultValue,
      oldValue: GlobusStateValue | DefaultValue,
      isReset: boolean
    ) => void
  ) => void;
  trigger: 'get' | 'set';
}) => {
  // If there's a persisted value - set it on load
  const loadPersisted = async (): Promise<void> => {
    const savedValue = await loadSessionValue<GlobusStateValue>(key);

    if (savedValue != null) {
      setSelf(savedValue);
    }
  };

  // Asynchronously set the persisted data
  if (trigger === 'get') {
    loadPersisted();
  }

  // Subscribe to state changes and persist them to session storage
  onSet(
    (
      newValue: GlobusStateValue | DefaultValue,
      oldValue: GlobusStateValue | DefaultValue,
      isReset: boolean
    ) => {
      return isReset
        ? saveSessionValue(key, DefaultValue)
        : saveSessionValue<GlobusStateValue | DefaultValue>(key, newValue);
    }
  );
};

export const globusDefaultEndpoint = atom<GlobusStateValue>({
  key: GlobusStateKeys.defaultEndpoint,
  default: null,
});

export const globusUseDefaultEndpoint = atom<boolean>({
  key: GlobusStateKeys.useDefaultEndpoint,
  default: false,
});

export default GlobusStateKeys;
