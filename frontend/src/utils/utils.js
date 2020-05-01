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

/**
 * Joins adjacent elements of the facets obj into a tuple using reduce().
 * setParsedFacets converts an array to an array of tuples.
 * For example, the array [var1, count1, var2, count2] turns into
 * [[var1, count1], [var2, count2]]
 *
 * Source: https://stackoverflow.com/questions/37270508/javascript-function-that-converts-array-to-array-of-2-tuples
 * @param {Object.<string, Array.<Array<string, number>>} facets
 */
export function parseFacets(facets) {
  const res = facets;
  const keys = Object.keys(facets);

  keys.forEach((key) => {
    res[key] = res[key].reduce((r, a, i) => {
      if (i % 2) {
        r[r.length - 1].push(a);
      } else {
        r.push([a]);
      }
      return r;
    }, []);
  });
  return res;
}
