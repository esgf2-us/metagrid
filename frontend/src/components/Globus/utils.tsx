import { loadSessionValue } from '../../api';
import GlobusStateKeys from './recoil/atom';
import { GlobusTokenResponse } from './types';

export default async function getGlobusTransferToken(): Promise<GlobusTokenResponse | null> {
  const token = await loadSessionValue<GlobusTokenResponse>(GlobusStateKeys.transferToken);
  if (token?.expires_in) {
    const createTime = token.created_on;
    const lifeTime = token.expires_in;
    const expires = createTime + lifeTime;
    const curTime = Math.floor(Date.now() / 1000);

    if (curTime <= expires) {
      return token;
    }
    return null;
  }
  return null;
}
