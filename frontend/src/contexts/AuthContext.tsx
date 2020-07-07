import React from 'react';
import { useKeycloak } from '@react-keycloak/web';
import { useAsync, DeferFn } from 'react-async';

import axios from '../axios';

const AuthContext = React.createContext<UserAuth>({
  access_token: null,
  refresh_token: null,
});

/**
 * Fetches the local user from the MetaGrid back-end
 */
export const fetchUser = async (args: [string]): Promise<UserAuth> => {
  return axios
    .post(`/dj-rest-auth/keycloak`, { access_token: args[0] })
    .then((res) => {
      return res.data as Promise<UserAuth>;
    })
    .catch((error) => {
      throw new Error(error);
    });
};

type Props = { children: React.ReactNode };

export const AuthProvider: React.FC<Props> = ({ children }) => {
  const [keycloak] = useKeycloak();
  const { data, run } = useAsync({
    deferFn: (fetchUser as unknown) as DeferFn<UserAuth>,
  });

  React.useEffect(() => {
    /* istanbul ignore else */
    if (keycloak.token) {
      run(keycloak.token);
    }
  }, [run, keycloak.token]);

  return (
    <AuthContext.Provider
      value={{
        access_token: data?.access_token || null,
        refresh_token: data?.refresh_token || null,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
