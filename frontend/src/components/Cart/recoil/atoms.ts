import { atom } from 'recoil';
import { RawSearchResults } from '../../Search/types';
import { localStorageEffect } from '../../../common/utils';

enum CartStateKeys {
  cartItemSelections = 'cartItemSelections',
  cartDownloadIsLoading = 'downloadIsLoading',
}

export const cartDownloadIsLoadingAtom = atom<boolean>({
  key: CartStateKeys.cartDownloadIsLoading,
  default: false,
  effects: [localStorageEffect<boolean>(CartStateKeys.cartDownloadIsLoading, false)],
});

export const cartItemSelectionsAtom = atom<RawSearchResults>({
  key: CartStateKeys.cartItemSelections,
  default: [],
  effects: [localStorageEffect<RawSearchResults>(CartStateKeys.cartItemSelections, [])],
});
