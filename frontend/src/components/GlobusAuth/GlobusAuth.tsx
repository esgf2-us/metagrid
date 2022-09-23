import PKCE from 'js-pkce';

// Reference: https://github.com/bpedroza/js-pkce
const PkceAuth = new PKCE({
  client_id: 'a63334f4-df31-4a43-9396-14c2615b3391', // Update this using your native client ID
  redirect_uri: 'http://localhost:3000/search', // Update this if you are deploying this anywhere else (Globus Auth will redirect back here once you have logged in)
  authorization_endpoint: 'https://auth.globus.org/v2/oauth2/authorize', // No changes needed
  token_endpoint: 'https://auth.globus.org/v2/oauth2/token', // No changes needed
  requested_scopes: 'openid profile email transfer', // Update with any scopes you would need, e.g. transfer
});

export default PkceAuth;
