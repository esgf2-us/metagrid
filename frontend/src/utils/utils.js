/**
 * Checks if an object is empty.
 * @param {*} obj
 */
export function isEmpty(obj) {
  return !obj || Object.keys(obj).length === 0;
}

/**
 * Makes a string human-readable rather than underscore separated and lowercase.
 * @param {*} str
 */
export function humanize(str) {
  const frags = str.split('_');
  for (let i = 0; i < frags.length; i += 1) {
    frags[i] = frags[i].charAt(0).toUpperCase() + frags[i].slice(1);
  }
  return frags.join(' ');
}
