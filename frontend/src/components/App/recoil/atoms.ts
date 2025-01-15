import { atom } from 'recoil';

export const isDarkModeAtom = atom<boolean>({
  key: 'isDarkMode',
  default: false,
});

export default isDarkModeAtom;
