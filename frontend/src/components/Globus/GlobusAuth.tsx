/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */

import PKCE from 'js-pkce';
import ITokenResponse from 'js-pkce/dist/ITokenResponse';

export interface GlobusTokenResponse extends ITokenResponse {
  id_token: string;
  resource_server: string;
  other_tokens: any;
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
  client_id: 'dc983d3a-30be-43e2-b3db-28e1cad9bad5', // Update this using your native client ID
  redirect_uri: 'http://localhost:3000/cart/items', // Update this if you are deploying this anywhere else (Globus Auth will redirect back here once you have logged in)
  authorization_endpoint: 'https://auth.globus.org/v2/oauth2/authorize', // No changes needed
  token_endpoint: 'https://auth.globus.org/v2/oauth2/token', // No changes needed
  requested_scopes: 'openid profile email offline_access', // Update with any scopes you would need, e.g. transfer
});

export const updateGlobusAccessTokens = (): void => {
  // Simple check to see if we have an authorization callback in the URL
  const params = new URLSearchParams(window.location.search);
  const globusAuthCode = params.get('code');
  // const globusState = params.get('state');

  if (globusAuthCode) {
    console.log('Getting a token...');

    // Just for trouble shooting.
    // window.localStorage.setItem('authCode', JSON.stringify(globusAuthCode));
    // window.localStorage.setItem('authState', JSON.stringify(globusState));

    const url = window.location.href;
    GlobusAuth.exchangeForAccessToken(url)
      .then((response: { refresh_token: string }) => {
        // This isn't strictly necessary but it ensures no code reuse.
        sessionStorage.removeItem('pkce_code_verifier');
        sessionStorage.removeItem('pkce_state');
        console.log('Cleared the PKCE state!');

        // Redirect back to the root URL (simple but brittle way to clear the query params)
        const newUrl = window.location.href.split('?')[0];
        window.location.replace(newUrl);

        if (response) {
          window.localStorage.setItem('response', JSON.stringify(response));
          window.localStorage.setItem(
            'globus_auth_token',
            response.refresh_token
          );
        }
      })
      .catch((error: any) => {
        // This isn't strictly necessary but it ensures no code reuse.
        sessionStorage.removeItem('pkce_code_verifier');
        sessionStorage.removeItem('pkce_state');
        console.log('Cleared the PKCE state!');

        // Redirect back to the root URL (simple but brittle way to clear the query params)
        const newUrl = window.location.href.split('?')[0];
        window.location.replace(newUrl);
        window.localStorage.setItem('tokenError', JSON.stringify(error));
      });
  }
};

export const loginWithGlobus: () => void = () => {
  const authUrl: string = GlobusAuth.authorizeUrl();
  console.log(`Sending the user to ${authUrl}`);
  window.location.replace(authUrl);
};

export const logoutGlobus: () => void = () => {
  // Should revoke here
  localStorage.removeItem('globus_auth_token');
  localStorage.removeItem('globus_id_token');
  const url = window.location.href.split('?')[0];
  window.location.replace(url);
};

export const getGlobusAuthToken = (): string | null => {
  return localStorage.getItem('globus_auth_token');
};

export const getGlobusIdToken = (): string | null => {
  return localStorage.getItem('globus_id_token');
};

export const isSignedIntoGlobus = (): boolean => {
  const authToken = getGlobusAuthToken();

  return authToken !== null && authToken !== 'undefined';
};

export const getDefaultGlobusEndpoint = (): GlobusEndpointData | null => {
  const endpointInfo = localStorage.getItem('defaultGlobusEndpoint');
  if (endpointInfo) {
    return JSON.parse(endpointInfo) as GlobusEndpointData;
  }
  return null;
};

export const setDefaultGlobusEndpoint = (endpointId: string): void => {
  return localStorage.setItem('defaultGlobusEndpoint', endpointId);
};

export const redirectToSelectGlobusEndpoint = (): void => {
  const endpointSearchURL =
    'https://app.globus.org/file-manager?action=http://localhost:3000/cart/items&method=GET&cancelUrl=http://localhost:3000/search';
  window.location.replace(endpointSearchURL);
};

export const checkGlobusEndpointLoaded = (): void => {
  // Simple check to see if we have an authorization callback in the URL
  const params = new URLSearchParams(window.location.search);

  const endpoint = params.get('endpoint');
  if (endpoint) {
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

    const newUrl = window.location.href.split('?')[0];
    // window.location.replace(newUrl);
    window.history.replaceState({}, '', newUrl);
  }
};

export default GlobusAuth;
