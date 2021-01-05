import { useKeycloak } from '@react-keycloak/web';
import React from 'react';
import { DeferFn, useAsync } from 'react-async';
import { fetchUserAuth, fetchUserInfo } from '../api';
import { RawUserAuth, RawUserInfo } from './types';

export const AuthContext = React.createContext<RawUserAuth & RawUserInfo>({
  access_token: null,
  refresh_token: null,
  pk: null,
});

type Props = { children: React.ReactNode };

export const AuthProvider: React.FC<Props> = ({ children }) => {
  // Keycloak instance
  const { keycloak } = useKeycloak();

  // MetaGrid authenticated user tokens
  const { data: userAuth, run: runFetchUserAuth } = useAsync({
    deferFn: (fetchUserAuth as unknown) as DeferFn<RawUserAuth>,
  });

  // MetaGrid authenticated user info
  const { data: userInfo, run: runFetchUserInfo } = useAsync({
    deferFn: (fetchUserInfo as unknown) as DeferFn<RawUserInfo>,
  });

  /**
   * Fetch the MetaGrid auth tokens with valid Keycloak access token.
   *
   * The runFetchUserAuth function is set to run approximately every 5 minutes
   * to ensure the user does not encounter an expired token.
   */
  React.useEffect(() => {
    /* istanbul ignore else */
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
    /* istanbul ignore else */
    if (userAuth?.access_token) {
      runFetchUserInfo(userAuth.access_token);
    }
  }, [runFetchUserInfo, userAuth]);
  return (
    <AuthContext.Provider
      value={{
        access_token: userAuth?.access_token || null,
        refresh_token: userAuth?.refresh_token || null,
        pk: userInfo?.pk || null,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
