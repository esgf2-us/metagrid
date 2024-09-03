import { atom } from 'recoil';
import { GlobusEndpoint, GlobusTaskItem } from '../types';

// Folder structure based on: https://wes-rast.medium.com/recoil-project-structure-best-practices-79e74a475caa

enum GlobusStateKeys {
  accessToken = 'globusAccessToken',
  userChosenEndpoint = 'globusChosenEndpoint',
  continueGlobusPrep = 'continueGlobusPrepSteps',
  continueGlobusDownload = 'continueDownloadSteps',
  globusTransferGoalsState = 'globusTransferGoalsState',
  globusAuth = 'globusAuth',
  globusTaskItems = 'globusTaskItems',
  tokenResponse = 'tokenResponse',
  transferToken = 'globusTransferToken',
  savedGlobusEndpoints = 'savedGlobusEndpoints',
}

export const globusTaskItems = atom<GlobusTaskItem[]>({
  key: GlobusStateKeys.globusTaskItems,
  default: [],
});

export const globusSavedEndpoints = atom<GlobusEndpoint[]>({
  key: GlobusStateKeys.savedGlobusEndpoints,
  default: [
    {
      canonical_name: '',
      contact_email: '',
      display_name: 'Select Globus Collection',
      entity_type: '',
      id: '',
      owner_id: '',
      owner_string: '',
      path: '',
      subscription_id: '',
    },
  ],
});

export default GlobusStateKeys;
