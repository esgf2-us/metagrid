import { atom } from 'recoil';
import { RawSearchResults } from '../../Search/types';

enum CartStateKeys {
  userCartItems = 'userCartItems',
  cartSelectionIds = 'cartSelectionIds',
  cartDownloadIsLoading = 'downloadIsLoading',
}

export const cartDownloadIsLoading = atom<boolean>({
  key: CartStateKeys.cartDownloadIsLoading,
  default: false,
});

export const userCartItems = atom<RawSearchResults>({
  key: CartStateKeys.userCartItems,
  default: [],
});

export const cartSelectionIds = atom<string[]>({
  key: CartStateKeys.cartSelectionIds,
  default: [],
});

export default CartStateKeys;
