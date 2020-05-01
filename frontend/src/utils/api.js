import axios from 'axios';

/**
 * Fetches list of projects.
 * TODO: Call an API
 */
export const fetchProjects = async () => {
  return axios
    .get(`/api/v1/projects/`)
    .then((res) => {
      return res.data;
    })
    .catch((error) => {
      return error;
    });
};

/**
 * Fetch the initial facets for the project
 * TODO: Use an API
 * TODO: Facets should update based on the returned results
 * @param {string} selectedProject - The selected project
 */
export const fetchFacets = async ([selectedProject]) => {
  return fetch(`./mock_apis/${selectedProject.toLowerCase()}.json`)
    .then((res) => (res.ok ? res : Promise.reject(res)))
    .then((res) => res.json());
};
/**
 *
 * @param {*} param0
 */
export const fetchFacetsApi = async ([baseUrl]) => {
  return axios
    .get(`https://cors-anywhere.herokuapp.com/${baseUrl}`)
    .then((res) => {
      return res.data;
    })
    .catch((error) => {
      return error;
    });
};

/**
 * Fetch the results based on the project and user's applied free-text and facets
 * TODO: Use an API
 * @param {string} project - The selected project
 * @param {arrayOf(string)} textInputs - The free-text inputs
 * @param {arrayOf(objectOf(*))} appliedFacets - The applied facets
 */
export const fetchResults = async ([baseUrl]) => {
  return axios
    .get(
      `https://cors-anywhere.herokuapp.com/${baseUrl.replace(
        'limit=0',
        'limit=10000'
      )}`
    )
    .then((res) => {
      return res.data;
    })
    .catch((error) => {
      return error;
    });
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
