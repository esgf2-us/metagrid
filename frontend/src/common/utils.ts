/**
 * Checks if an object is empty.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const objectIsEmpty = (obj: Record<any, any>): boolean => {
  return !obj || Object.keys(obj).length === 0;
};

/**
 * Checks if the specified key is in the object
 */
export const objectHasKey = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  obj: Record<any, any>,
  key: string | number
): boolean => {
  return Object.prototype.hasOwnProperty.call(obj, key);
};

/**
 * Parses urls to remove characters following the specified character
 */
export const splitURLByChar = (
  url: string,
  char: string,
  returnHalf: 'first' | 'second'
): string => {
  if (returnHalf === 'first') {
    return url.split(char)[0];
  }
  return url.split(char)[1];
};

/**
 * Performs a shallow comparison between two objects to check if they are equal.
 * https://stackoverflow.com/a/52323412
 */
export const shallowCompareObjects = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  obj1: { [key: string]: any },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  obj2: { [key: string]: any }
): boolean =>
  Object.keys(obj1).length === Object.keys(obj2).length &&
  Object.keys(obj1).every(
    (key) => obj2.hasOwnProperty.call(obj2, key) && obj1[key] === obj2[key]
  );
/**
 * Converts binary bytes into another size
 * https://stackoverflow.com/a/18650828
 */
export const formatBytes = (bytes: number, decimals = 2): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / k ** i).toFixed(dm))} ${sizes[i]}`;
};
