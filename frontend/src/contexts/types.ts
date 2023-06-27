export type RawUserAuth = {
  access_token: string | null;
  is_authenticated: boolean | false;
  pk: string | null;
};

export type RawUserInfo = {
  pk: string | null;
};
