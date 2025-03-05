import { atom } from 'recoil';
import { RawSearchResults } from '../../Search/types';
import { localStorageEffect } from '../../../common/utils';

enum CartStateKeys {
  cartItemSelections = 'cartItemSelections',
  cartDownloadIsLoading = 'downloadIsLoading',
}

export const cartDownloadIsLoading = atom<boolean>({
  key: CartStateKeys.cartDownloadIsLoading,
  default: false,
  effects: [localStorageEffect<boolean>(CartStateKeys.cartDownloadIsLoading, false)],
});

export const cartItemSelections = atom<RawSearchResults>({
  key: CartStateKeys.cartItemSelections,
  default: [],
  effects: [localStorageEffect<RawSearchResults>(CartStateKeys.cartItemSelections, [])],
});

export default CartStateKeys;
