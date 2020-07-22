import React from 'react';
import { useKeycloak } from '@react-keycloak/web';
import { useAsync, DeferFn } from 'react-async';

import axios from '../axios';
import apiRoutes from '../api/routes';

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
  const [keycloak] = useKeycloak();
  const { data: userAuth, run: runFetchUserAuth } = useAsync({
    deferFn: (fetchUserAuth as unknown) as DeferFn<RawUserAuth>,
  });
  const { data: userInfo, run: runFetchUserInfo } = useAsync({
    deferFn: (fetchUserInfo as unknown) as DeferFn<RawUserInfo>,
  });

  React.useEffect(() => {
    /* istanbul ignore else */
    if (keycloak.token) {
      runFetchUserAuth(keycloak.token);
    }
  }, [runFetchUserAuth, keycloak.token]);

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
