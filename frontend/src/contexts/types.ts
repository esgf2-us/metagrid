export type RawUserAuth = {
  access_token: string | null;
  email: string | null;
  is_authenticated: boolean;
  pk: string | null;
  refresh_token: string | null;
};

export type RawUserInfo = {
  pk: string | null;
};
export interface Identity {
  sub: string;
  organization: string;
  name: string;
  preferred_username: string;
  identity_provider: string;
  identity_provider_display_name: string;
  email: string;
  last_authentication: number;
  identity_set: Identity[];
}
