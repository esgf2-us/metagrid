/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-explicit-any */

import PKCE from 'js-pkce';
import ITokenResponse from 'js-pkce/dist/ITokenResponse';
import {
  getDataFromLocal,
  removeFromLocal,
  saveDataToLocal,
} from '../../common/utils';
import { globusClientID, globusRedirectUrl } from '../../env';

export interface GlobusTokenResponse extends ITokenResponse {
  id_token: string;
  resource_server: string;
  other_tokens: any;
  created_on: number;
  expires_in: number;
  error?: any;
}

export type GlobusEndpointData = {
  endpoint: string | null;
  label: string | null;
  path: string | null;
  globfs: string | null;
  endpointId?: string | null;
};

// Reference: https://github.com/bpedroza/js-pkce
const GlobusAuth = new PKCE({
  client_id: globusClientID, // Update this using your native client ID
  redirect_uri: globusRedirectUrl, // Update this if you are deploying this anywhere else (Globus Auth will redirect back here once you have logged in)
  authorization_endpoint: 'https://auth.globus.org/v2/oauth2/authorize', // No changes needed
  token_endpoint: 'https://auth.globus.org/v2/oauth2/token', // No changes needed
  requested_scopes:
    'openid profile email offline_access urn:globus:auth:scope:transfer.api.globus.org:all', // Update with any scopes you would need, e.g. transfer
});

export const clearUrlParams = (): void => {
  // Redirect back to the root URL (simple but brittle way to clear the query params)
  const splitUrl = window.location.href.split('?');
  if (splitUrl.length > 1) {
    const newUrl = splitUrl[0];
    window.location.replace(newUrl);
  }
};

const processGlobusEndpointParams = (params: URLSearchParams): void => {
  if (params.has('endpoint')) {
    const endpoint = params.get('endpoint');
    const label = params.get('label');
    const path = params.get('path');
    const globfs = params.get('globfs');
    const endpointId = params.get('endpoint_id');

    const endpointInfo: GlobusEndpointData = {
      endpoint,
      label,
      path,
      globfs,
      endpointId,
    };
    saveDataToLocal('userSelectedEndpoint', endpointInfo);
  }
};

const processGlobusSignIn = async (): Promise<void> => {
  const url = window.location.href;

  try {
    const tokenResponse = (await GlobusAuth.exchangeForAccessToken(
      url
    )) as GlobusTokenResponse;

    // Save the full token response for troubleshooting
    if (tokenResponse) {
      saveDataToLocal('response', tokenResponse);

      if (tokenResponse.access_token) {
        saveDataToLocal('globus_access_token', tokenResponse.access_token);
      } else {
        removeFromLocal('globus_access_token');
      }

      if (tokenResponse.refresh_token) {
        saveDataToLocal('globus_refresh_token', tokenResponse.refresh_token);
      } else {
        removeFromLocal('globus_refresh_token');
      }

      // Try to find and get the transfer token
      if (tokenResponse.other_tokens) {
        const otherTokens: GlobusTokenResponse[] = [
          ...tokenResponse.other_tokens,
        ];
        otherTokens.forEach((tokenBlob) => {
          if (
            tokenBlob.resource_server &&
            tokenBlob.resource_server === 'transfer.api.globus.org'
          ) {
            const newTransferToken = tokenBlob;
            newTransferToken.created_on = Math.floor(Date.now() / 1000);
            saveDataToLocal('globus_transfer_token', newTransferToken);
          }
        });
      } else {
        removeFromLocal('globus_transfer_token');
      }

      if (tokenResponse.error) {
        saveDataToLocal('savedError', tokenResponse.error);
      }
    }
  } catch (error: any) {
    saveDataToLocal('savedError', error);
    sessionStorage.removeItem('pkce_code_verifier');
    sessionStorage.removeItem('pkce_state');
  } finally {
    // This isn't strictly necessary but it ensures no code reuse.
    sessionStorage.removeItem('pkce_code_verifier');
    sessionStorage.removeItem('pkce_state');
  }
};

export const processGlobusParams = async (): Promise<void> => {
  const params = new URLSearchParams(window.location.search);

  if (params.has('code') && params.has('state')) {
    await processGlobusSignIn();
  } else if (params.has('endpoint')) {
    processGlobusEndpointParams(params);
  }

  saveDataToLocal('lastUrl', window.location.href);
  clearUrlParams();
};

export const loginWithGlobus: () => void = () => {
  const authUrl: string = GlobusAuth.authorizeUrl();
  window.location.replace(authUrl);
};

export const logoutGlobus: () => void = () => {
  // Should revoke here
  removeFromLocal('globus_access_token');
  removeFromLocal('globus_refresh_token');
  removeFromLocal('globus_transfer_token');
  removeFromLocal('globus_id_token');
  const url = window.location.href.split('?')[0];
  window.location.replace(url);
};

export const getGlobusAccessToken = (): string | null => {
  return getDataFromLocal<string>('globus_access_token');
};

export const getGlobusRefreshToken = (): string | null => {
  return getDataFromLocal<string>('globus_refresh_token');
};

export const getGlobusTransferToken = (): GlobusTokenResponse | null => {
  const transferToken = getDataFromLocal<GlobusTokenResponse>(
    'globus_transfer_token'
  );
  if (transferToken && transferToken.expires_in && transferToken.created_on) {
    const createTime = transferToken.created_on;
    const lifeTime = transferToken.expires_in;
    const expires = createTime + lifeTime;
    const curTime = Math.floor(Date.now() / 1000);

    if (curTime <= expires) {
      return transferToken;
    }
    return null;
  }
  return null;
};

export const getGlobusIdToken = (): string | null => {
  return getDataFromLocal<string>('globus_id_token');
};

export const isSignedIntoGlobus = (): boolean => {
  const authToken = getGlobusRefreshToken();

  if (authToken !== null && authToken !== 'undefined') {
    // Check auth token isn't expired
    const transferToken = getGlobusTransferToken();

    return transferToken !== null;
  }
  return false;
};

export const getDefaultGlobusEndpoint = (): GlobusEndpointData | null => {
  return getDataFromLocal<GlobusEndpointData>('defaultGlobusEndpoint');
};

export const setDefaultGlobusEndpoint = (
  endpoint: GlobusEndpointData
): void => {
  saveDataToLocal('defaultGlobusEndpoint', endpoint);
};

export const redirectToSelectGlobusEndpoint = (): void => {
  const endpointSearchURL =
    'https://app.globus.org/file-manager?action=http://localhost:3000/cart/items&method=GET&cancelUrl=http://localhost:3000/cart/items';
  window.location.replace(endpointSearchURL);
};

export default GlobusAuth;
