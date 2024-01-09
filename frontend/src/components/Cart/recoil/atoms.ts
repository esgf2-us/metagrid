import { atom } from 'recoil';
import { RawSearchResults } from '../../Search/types';

enum CartStateKeys {
  cartItemSelections = 'cartItemSelections',
  cartDownloadIsLoading = 'downloadIsLoading',
}

export const cartDownloadIsLoading = atom<boolean>({
  key: CartStateKeys.cartDownloadIsLoading,
  default: false,
});

export const cartItemSelections = atom<RawSearchResults>({
  key: CartStateKeys.cartItemSelections,
  default: [],
});

export default CartStateKeys;
