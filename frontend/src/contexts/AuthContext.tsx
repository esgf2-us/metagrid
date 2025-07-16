import React from 'react';
import { useKeycloak } from '@react-keycloak/web';
import { DeferFn, useAsync } from 'react-async';
import { fetchGlobusAuth, fetchUserAuth, fetchUserInfo } from '../api';
import { RawUserAuth, RawUserInfo } from './types';

export const AuthContext = React.createContext<RawUserAuth & RawUserInfo>({
  access_token: null,
  email: null,
  is_authenticated: false,
  refresh_token: null,
  pk: null,
});

type Props = { children: React.ReactNode };

export const GlobusAuthProvider: React.FC<Props> = ({ children }) => {
  const { data: userAuth, run: runFetchGlobusAuth } = useAsync({
    deferFn: fetchGlobusAuth as unknown as DeferFn<RawUserAuth>,
  });

  /**
   * Fetch the MetaGrid auth tokens with valid Globus access token.
   *
   * The runFetchGlobusUserAuth function is set to run approximately every 5 minutes
   * to ensure the user does not encounter an expired token.
   */
  React.useEffect(() => {
    runFetchGlobusAuth();
    const interval = setInterval(() => {
      runFetchGlobusAuth();
    }, 295000);
    return () => clearInterval(interval);
  }, [runFetchGlobusAuth, userAuth?.is_authenticated]);

  return (
    <AuthContext.Provider
      value={{
        access_token: userAuth?.access_token || null,
        email: (userAuth?.email as string) || null,
        is_authenticated: (userAuth?.is_authenticated as boolean) || false,
        refresh_token: userAuth?.refresh_token || null,
        pk: (userAuth?.pk as string) || null,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const KeycloakAuthProvider: React.FC<Props> = ({ children }) => {
  // Keycloak instance
  const { keycloak } = useKeycloak();

  // MetaGrid authenticated user tokens
  const { data: userAuth, run: runFetchUserAuth } = useAsync({
    deferFn: fetchUserAuth as unknown as DeferFn<RawUserAuth>,
  });

  // MetaGrid authenticated user info
  const { data: userInfo, run: runFetchUserInfo } = useAsync({
    deferFn: fetchUserInfo as unknown as DeferFn<RawUserInfo>,
  });

  /**
   * Fetch the MetaGrid auth tokens with valid Keycloak access token.
   *
   * The runFetchUserAuth function is set to run approximately every 5 minutes
   * to ensure the user does not encounter an expired token.
   */
  /* istanbul ignore next */
  React.useEffect(() => {
    if (keycloak.token) {
      runFetchUserAuth(keycloak.token);
      const interval = setInterval(() => {
        runFetchUserAuth(keycloak.token);
      }, 295000);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [runFetchUserAuth, keycloak.token]);

  /**
   * Fetch the authenticated user's information with valid MetaGrid access token.
   */
  React.useEffect(() => {
    /* istanbul ignore next */
    if (userAuth?.access_token) {
      userAuth.is_authenticated = true;
      runFetchUserInfo(userAuth.access_token);
    }
  }, [runFetchUserInfo, userAuth]);
  return (
    <AuthContext.Provider
      value={{
        access_token: userAuth?.access_token || null,
        email: (userAuth?.email as string) || null,
        is_authenticated: userAuth?.is_authenticated || false,
        refresh_token: userAuth?.refresh_token || null,
        pk: userInfo?.pk || null,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
