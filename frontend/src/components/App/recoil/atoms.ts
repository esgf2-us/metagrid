import { atom, AtomEffect } from 'recoil';

export const darkModeStorageEffect = (key: string): AtomEffect<boolean> => ({ setSelf, onSet }) => {
  const savedValue = localStorage.getItem(key);
  if (savedValue != null) {
    setSelf(savedValue === 'true');
  } else {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setSelf(mediaQuery.matches);
  }

  onSet((newValue, _, isReset) => {
    if (isReset) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, newValue.toString());
    }
  });
};

export const isDarkModeAtom = atom<boolean>({
  key: 'isDarkMode',
  default: false,
  effects: [darkModeStorageEffect('isDarkMode')],
});

export default isDarkModeAtom;
