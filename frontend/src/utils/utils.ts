/**
 * Checks if an object is empty.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isEmpty = (obj: Record<any, any>): boolean => {
  return !obj || Object.keys(obj).length === 0;
};

/**
 * Makes a string human-readable rather than underscore separated and lowercase.
 */
export const humanize = (str: string): string => {
  const frags = str.split('_');
  for (let i = 0; i < frags.length; i += 1) {
    frags[i] = frags[i].charAt(0).toUpperCase() + frags[i].slice(1);
  }
  return frags.join(' ');
};

/** Parses urls to remove characters following the specified character
 */
export const parseUrl = (url: string, char: string): string => {
  return url.split(char)[0];
};

/**
 * Checks if the specified key is in the object
 */
export const hasKey = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  obj: Record<any, any>,
  key: string | number
): boolean => {
  return Object.prototype.hasOwnProperty.call(obj, key);
};

/**
 * Converts binary bytes into another size
 * Source: https://stackoverflow.com/a/18650828
 */
export const formatBytes = (bytes: number, decimals = 2): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / k ** i).toFixed(dm))} ${sizes[i]}`;
};
