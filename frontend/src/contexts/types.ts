import { Step } from 'react-joyride';

export type RawUserAuth = {
  access_token: string | null;
  refresh_token: string | null;
};

export type RawUserInfo = {
  pk: string | null;
};
