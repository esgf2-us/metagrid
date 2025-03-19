import { atom, AtomEffect } from 'recoil';

const darkModeStorageEffect = (key: string): AtomEffect<boolean> => ({ setSelf, onSet }) => {
  const savedValue = localStorage.getItem(key);
  if (savedValue != null) {
    setSelf(savedValue === 'true');
  } else {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setSelf(mediaQuery.matches);
  }

  onSet((newValue) => {
    localStorage.setItem(key, newValue.toString());
  });
};

const isDarkModeAtom = atom<boolean>({
  key: 'isDarkMode',
  default: false,
  effects: [darkModeStorageEffect('isDarkMode')],
});

export const isSTACmodeAtom = atom<boolean>({
  key: 'isSTACmode',
  default: true,
});

export default isDarkModeAtom;
