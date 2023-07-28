export type RawUserAuth = {
  access_token: string | null;
  email: string | null;
  is_authenticated: boolean | false;
  pk: string | null;
  refresh_token: string | null;
};

export type RawUserInfo = {
  pk: string | null;
};
