/* eslint-disable class-methods-use-this */

import { GlobusTokenResponse } from '../../components/Globus/types';
import { globusTokenResponseFixture } from '../mock/fixtures';
import { tempStorageGetMock } from '../jestTestFunctions';

class PKCE {
  client_id = '';

  redirect_uri = '';

  authorization_endpoint = '';

  token_endpoint = '';

  requested_scopes = '';

  constructor(config: {
    client_id: string;
    redirect_uri: string;
    authorization_endpoint: string;
    token_endpoint: string;
    requested_scopes: string;
  }) {
    this.client_id = config.client_id;
    this.redirect_uri = config.redirect_uri;
    this.authorization_endpoint = config.authorization_endpoint;
    this.token_endpoint = config.token_endpoint;
    this.requested_scopes = config.requested_scopes;
  }

  exchangeForAccessToken(): Promise<GlobusTokenResponse> {
    const test = tempStorageGetMock('pkce-pass');
    if (test === true) {
      return (
        Promise.resolve(globusTokenResponseFixture()) || Promise.resolve({})
      );
    }
    return Promise.reject();
  }

  authorizeUrl(): string {
    return 'youAreAuthorized!';
  }
}

export default PKCE;
