import { atom } from 'recoil';
import { GlobusStateValue, GlobusTaskItem } from '../types';

// Folder structure based on: https://wes-rast.medium.com/recoil-project-structure-best-practices-79e74a475caa

enum GlobusStateKeys {
  accessToken = 'globusAccessToken',
  userChosenEndpointUUID = 'globusChosenEndpointUUID',
  continueGlobusPrepSteps = 'continueGlobusPreparationSteps',
  defaultEndpoint = 'defaultGlobusEndpoint',
  globusAuth = 'globusAuth',
  globusTaskItems = 'globusTaskItems',
  refreshToken = 'globusRefreshToken',
  tokenResponse = 'tokenResponse',
  transferToken = 'globusTransferToken',
  useDefaultEndpoint = 'useDefaultEndpoint',
  userSelectedEndpoint = 'userSelectedEndpoint',
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
