import React from 'react';
import { DeferFn, useAsync } from 'react-async';
import { fetchGlobusAuth } from '../api';
import { RawUserAuth, RawUserInfo } from './types';

export const AuthContext = React.createContext<RawUserAuth & RawUserInfo>({
  access_token: null,
  is_authenticated: false,
  pk: null,
});

type Props = { children: React.ReactNode };

export const AuthProvider: React.FC<Props> = ({ children }) => {
  // Globus authenticated user tokens
  const { data: userAuth, run: runFetchGlobusAuth } = useAsync({
    deferFn: (fetchGlobusAuth as unknown) as DeferFn<RawUserAuth>,
  });

  /**
   * Fetch the MetaGrid auth tokens with valid Globus access token.
   *
   * The runFetchGlobusUserAuth function is set to run approximately every 5 minutes
   * to ensure the user does not encounter an expired token.
   */
  React.useEffect(() => {
    /* istanbul ignore else */
    if (userAuth?.is_authenticated) {
      runFetchGlobusAuth();
      const interval = setInterval(() => {
        runFetchGlobusAuth();
      }, 295000);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [runFetchGlobusAuth, userAuth?.is_authenticated]);

  return (
    <AuthContext.Provider
      value={{
        access_token: userAuth?.access_token || null,
        is_authenticated: (userAuth?.is_authenticated as boolean) || false,
        pk: (userAuth?.pk as string) || null,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
