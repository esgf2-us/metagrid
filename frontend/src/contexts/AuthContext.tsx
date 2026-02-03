import React, { useMemo, useEffect } from 'react';
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

  useEffect(() => {
    runFetchGlobusAuth();
    const interval = setInterval(() => {
      runFetchGlobusAuth();
    }, 295000);
    return () => clearInterval(interval);
  }, [runFetchGlobusAuth, userAuth?.is_authenticated]);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({
      access_token: userAuth?.access_token || null,
      email: (userAuth?.email as string) || null,
      is_authenticated: (userAuth?.is_authenticated as boolean) || false,
      refresh_token: userAuth?.refresh_token || null,
      pk: (userAuth?.pk as string) || null,
    }),
    [userAuth],
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

export const KeycloakAuthProvider: React.FC<Props> = ({ children }) => {
  const { keycloak } = useKeycloak();

  const { data: userAuth, run: runFetchUserAuth } = useAsync({
    deferFn: fetchUserAuth as unknown as DeferFn<RawUserAuth>,
  });

  const { data: userInfo, run: runFetchUserInfo } = useAsync({
    deferFn: fetchUserInfo as unknown as DeferFn<RawUserInfo>,
  });

  /* istanbul ignore start */
  useEffect(() => {
    if (keycloak.token) {
      runFetchUserAuth(keycloak.token);
      const interval = setInterval(() => {
        runFetchUserAuth(keycloak.token);
      }, 295000);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [runFetchUserAuth, keycloak.token]);
  /* istanbul ignore end */

  /* istanbul ignore start */
  useEffect(() => {
    if (userAuth?.access_token) {
      userAuth.is_authenticated = true;
      runFetchUserInfo(userAuth.access_token);
    }
  }, [runFetchUserInfo, userAuth]);
  /* istanbul ignore end */

  const contextValue = useMemo(
    () => ({
      access_token: userAuth?.access_token || null,
      email: (userAuth?.email as string) || null,
      is_authenticated: userAuth?.is_authenticated || false,
      refresh_token: userAuth?.refresh_token || null,
      pk: userInfo?.pk || null,
    }),
    [userAuth, userInfo],
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};
export default AuthContext;
