import axios from 'axios';

import jsonData from '../mocks/db.json';

/**
 * Fetches list of projects.
 * TODO: Call an API instead of mock data
 */
export const fetchProjects = async () => {
  return JSON.parse(JSON.stringify(jsonData.projects));
};

/**
 * Fetch the results based on the project and user's applied free-text and facets
 * TODO: Call an API instead of mock data
 * @param {string} project - The selected project
 * @param {arrayOf(string)} textInputs - The free-text inputs
 * @param {arrayOf(objectOf(*))} appliedFacets - The applied facets
 */
export const fetchResults = async (project) => {
  return JSON.parse(JSON.stringify(jsonData[project].response.docs));
};

/**
 * Joins adjacent elements of the facets obj into a tuple using reduce()
 * https://stackoverflow.com/questions/37270508/javascript-function-that-converts-array-to-array-of-2-tuples
 * @param {Object.<string, Array.<Array<string, number>>} facets
 */
function parseFacets(facets) {
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
/**
 * Fetch the initial facets for the project
 * TODO: Facets should update based on the returned results
 * @param {string} project - The selected project
 */
export const fetchFacets = async (project) => {
  // TODO: Call an API instead of mock data
  const res = parseFacets(jsonData[project].facet_counts.facet_fields);
  return res;
};

/**
 * Fetches citation data using a dataset's citation url
 * @param {string} url
 * TODO: Get proxy to connect server hosting Citation data using localhost
 */
export const fetchCitation = async (url) => {
  axios
    .get(`https://cors-anywhere.herokuapp.com/${url}`)
    .then((res) => {
      return res.data;
    })
    .catch((error) => {
      return error;
    });
};
