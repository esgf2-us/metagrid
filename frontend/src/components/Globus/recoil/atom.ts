import { atom } from 'recoil';
import { SavedEndpoint, GlobusEndpointData, GlobusTaskItem } from '../types';

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
  savedGlobusEndpoints = 'savedGlobusEndpoints',
}

export const globusDefaultEndpoint = atom<GlobusEndpointData>({
  key: GlobusStateKeys.defaultEndpoint,
  default: undefined,
});

export const globusUseDefaultEndpoint = atom<boolean>({
  key: GlobusStateKeys.useDefaultEndpoint,
  default: false,
});

export const globusTaskItems = atom<GlobusTaskItem[]>({
  key: GlobusStateKeys.globusTaskItems,
  default: [],
});

export const globusSavedEndpoints = atom<SavedEndpoint[]>({
  key: GlobusStateKeys.savedGlobusEndpoints,
  default: [
    {
      contact_email: '',
      entity_type: '',
      key: '',
      label: 'Select Globus Endpoint',
      subscription_id: '',
      path: '',
    },
  ],
});

export default GlobusStateKeys;
