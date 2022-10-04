import PKCE from 'js-pkce';

// Reference: https://github.com/bpedroza/js-pkce
const GlobusAuth = new PKCE({
  client_id: 'dc983d3a-30be-43e2-b3db-28e1cad9bad5', // Update this using your native client ID
  redirect_uri: 'http://localhost:3000/search', // Update this if you are deploying this anywhere else (Globus Auth will redirect back here once you have logged in)
  authorization_endpoint: 'https://auth.globus.org/v2/oauth2/authorize', // No changes needed
  token_endpoint: 'https://auth.globus.org/v2/oauth2/token', // No changes needed
  requested_scopes: 'openid profile email', // Update with any scopes you would need, e.g. transfer
});

export const loginWithGlobus: () => void = () => {
  const authUrl = GlobusAuth.authorizeUrl();
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

export default GlobusAuth;
