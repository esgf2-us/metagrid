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
 * For a record's 'xlink' attribute, it will be split into an array of
 * three strings.
 *
 * xlink URL example: 'http://cera-www.dkrz.de/WDCC/meta/CMIP6/CMIP6.ScenarioMIP.CCCma.CanESM5.ssp126.r12i1p2f1.day.clt.gn.v20190429.json|Citation|citation'
 * Output split by '|': ['http://cera-www.dkrz.de/WDCC/meta/CMIP6/CMIP6.ScenarioMIP.CCCma.CanESM5.ssp126.r12i1p2f1.day.clt.gn.v20190429.json', 'Citation', 'citation])
 *
 */
export const splitStringByChar = (
  url: string,
  char: '|' | '.json' | ':',
  returnIndex?: '0' | '1' | '2'
): string[] | string => {
  const splitURL = url.split(char);

  if (returnIndex) {
    const returnIndexNum = Number(returnIndex);
    if (splitURL[returnIndexNum] === undefined) {
      throw new Error('Index does not exist in array of URLs');
    }
    return splitURL[returnIndexNum];
  }

  return splitURL;
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
