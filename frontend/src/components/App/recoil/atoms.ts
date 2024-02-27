import { atom } from 'recoil';
import { RawSearchResults } from '../../Search/types';

enum AppRecoilKeys {
  userCartItems = 'userCart',
}

export const userCartItems = atom<RawSearchResults>({
  key: AppRecoilKeys.userCartItems,
  default: JSON.parse(
    localStorage.getItem('userCart') || '[]'
  ) as RawSearchResults,
});

export default AppRecoilKeys;
