/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import PKCE from 'js-pkce';
import ITokenResponse from 'js-pkce/dist/ITokenResponse';
import { useAsync, DeferFn } from 'react-async';
import { fetchGlobusAuth, fetchUserAuth } from '../../api';
import { RawUserAuth } from '../../contexts/types';

export interface GlobusTokenResponse extends ITokenResponse {
  id_token: string;
  resource_server: string;
  other_tokens: any;
}

// Reference: https://github.com/bpedroza/js-pkce
const GlobusAuth = new PKCE({
  client_id: 'dc983d3a-30be-43e2-b3db-28e1cad9bad5', // Update this using your native client ID
  redirect_uri: 'http://localhost:3000/search', // Update this if you are deploying this anywhere else (Globus Auth will redirect back here once you have logged in)
  authorization_endpoint: 'https://auth.globus.org/v2/oauth2/authorize', // No changes needed
  token_endpoint: 'https://auth.globus.org/v2/oauth2/token', // No changes needed
  requested_scopes: 'openid profile email offline_access', // Update with any scopes you would need, e.g. transfer
});

export const updateGlobusAccessTokens = (): void => {
  // Simple check to see if we have an authorization callback in the URL
  const params = new URLSearchParams(window.location.search);
  const globusAuthCode = params.get('code');
  const globusState = params.get('state');

  if (globusAuthCode) {
    console.log('Getting a token...');
    window.localStorage.setItem('authCode', JSON.stringify(globusAuthCode));
    window.localStorage.setItem('authState', JSON.stringify(globusState));

    const url = window.location.href;

    /* const accessToken = GlobusAuth.exchangeForAccessToken(
      'http://localhost:3000/search',
      { refresh_token: window.localStorage.getItem('authCode') }
    )*/
    GlobusAuth.exchangeForAccessToken(url)
      .then((accessToken) => {
        // This isn't strictly necessary but it ensures no code reuse.
        sessionStorage.removeItem('pkce_code_verifier');
        sessionStorage.removeItem('pkce_state');
        console.log('Cleared the PKCE state!');

        // Redirect back to the root URL (simple but brittle way to clear the query params)
        const newUrl = window.location.href.split('?')[0];
        window.location.replace(newUrl);

        if (accessToken) {
          window.localStorage.setItem('response', JSON.stringify(accessToken));
          /* window.localStorage.setItem(
            'globus_auth_token',
            JSON.stringify(accessToken.refresh_token)
          );*/
        }
      })
      .catch((e) => {
        // This isn't strictly necessary but it ensures no code reuse.
        sessionStorage.removeItem('pkce_code_verifier');
        sessionStorage.removeItem('pkce_state');
        console.log('Cleared the PKCE state!');

        // Redirect back to the root URL (simple but brittle way to clear the query params)
        const newUrl = window.location.href.split('?')[0];
        window.location.replace(newUrl);
        window.localStorage.setItem('tokenError', JSON.stringify(e));
      });
    /* const url = window.location.href;
    GlobusAuth.exchangeForAccessToken(url).then((resp: ITokenResponse) => {
      const globusResp: GlobusTokenResponse = resp as GlobusTokenResponse;

      // If you get back multiple tokens you'll need to make changes here.
      const globusAccessToken = globusResp.access_token;
      const globusIdToken = globusResp.id_token;
      window.localStorage.setItem('lastResponse', JSON.stringify(globusResp));

      // Set it in local storage - the are a number of alternatives for
      // saving this that are arguably more secure but this is the simplest
      // for demonstration purposes.
      window.localStorage.setItem('globus_auth_token', globusAccessToken);
      window.localStorage.setItem('globus_id_token', globusIdToken);

    });*/
  }
};

export const loginWithGlobus: () => void = () => {
  const authUrl = GlobusAuth.authorizeUrl();
  console.log(`Sending the user to ${authUrl}`);
  window.location.replace(authUrl);
  // MetaGrid authenticated user tokens
  /* const { data: globusAuth, run: runGlobusUserAuth } = useAsync({
    deferFn: (fetchGlobusAuth as unknown) as DeferFn<RawUserAuth>,
  });

  console.log(globusAuth);
  runGlobusUserAuth();
  console.log(globusAuth);*/
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

export default GlobusAuth;
