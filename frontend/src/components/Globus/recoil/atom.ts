import { atom } from 'recoil';
import { GlobusStateValue, GlobusTaskItem } from '../types';

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
  globusTaskItems = 'globusTaskItems',
}

export const globusDefaultEndpoint = atom<GlobusStateValue>({
  key: GlobusStateKeys.defaultEndpoint,
  default: null,
});

export const globusUseDefaultEndpoint = atom<boolean>({
  key: GlobusStateKeys.useDefaultEndpoint,
  default: false,
});

export const globusTaskItems = atom<GlobusTaskItem[]>({
  key: GlobusStateKeys.globusTaskItems,
  default: [],
});

export default GlobusStateKeys;
