import { useKeycloak } from '@react-keycloak/web';
import React from 'react';
import { DeferFn, useAsync } from 'react-async';
import apiRoutes from '../api/routes';
import axios from '../lib/axios';

export type RawUserAuth = {
  access_token: string | null;
  refresh_token: string | null;
};

export type RawUserInfo = {
  pk: string | null;
};

export const AuthContext = React.createContext<RawUserAuth & RawUserInfo>({
  access_token: null,
  refresh_token: null,
  pk: null,
});

/**
 * Fetches the keycloak user auth tokens from the MetaGrid back-end
 */
export const fetchUserAuth = async (args: [string]): Promise<RawUserAuth> => {
  return axios
    .post(apiRoutes.keycloakAuth, { access_token: args[0] })
    .then((res) => {
      return res.data as Promise<RawUserAuth>;
    })
    .catch((error) => {
      throw new Error(error);
    });
};

/**
 * Fetches the user info from the MetaGrid back-end
 */
export const fetchUserInfo = async (args: [string]): Promise<RawUserInfo> => {
  return axios
    .get(apiRoutes.userInfo, {
      headers: {
        Authorization: `Bearer ${args[0]}`,
      },
    })
    .then((res) => {
      return res.data as Promise<RawUserInfo>;
    })
    .catch((error) => {
      throw new Error(error);
    });
};

type Props = { children: React.ReactNode };

export const AuthProvider: React.FC<Props> = ({ children }) => {
  // Keycloak instance
  const [keycloak] = useKeycloak();

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
