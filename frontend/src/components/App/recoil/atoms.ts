import { atom, AtomEffect } from 'recoil';

export const localStorageEffect = (key: string): AtomEffect<boolean> => ({ setSelf, onSet }) => {
  const savedValue = localStorage.getItem(key);
  if (savedValue != null) {
    setSelf(savedValue === 'true');
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
  effects: [localStorageEffect('isDarkMode')],
});

export default isDarkModeAtom;
