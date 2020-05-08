import queryString from 'query-string';
import axios from '../axios';

/**
 * Fetches a list of projects.
 * NOTE: Uses the axios baseURL
 */
export const fetchProjects = async () => {
  return axios
    .get(`/api/v1/projects/`)
    .then((res) => {
      return res.data;
    })
    .catch((error) => {
      throw new Error(error);
    });
};

/**
 * Fetches base facets for a project.
 * NOTE: Local proxy used to bypass CORS (http://localhost:8080/)
 * @param {*} param0.baseUrl - Base URL for a project to fetch facets
 */
export const fetchBaseFacets = async ([baseUrl]) => {
  return axios
    .get(`http://localhost:8080/${baseUrl}`)
    .then((res) => {
      return res.data;
    })
    .catch((error) => {
      throw new Error(error);
    });
};

/**
 * Generate a URL to perform a GET request to the ESG Search API.
 * Query string parameters use the logical OR operator, so queries are inclusive.
 * NOTE: Local proxy used to bypass CORS (http://localhost:8080/)
 * @param {string} baseUrl - Base url to perform queries
 * @param {arrayOf(string)} textInputs - Free-text user input
 * @param {arrayOf(objectOf(arrayOf(string)))} activeFacets - User applied facets
 */
const genUrlQuery = (baseUrl, textInputs, activeFacets) => {
  const stringifyFacets = queryString.stringify(activeFacets, {
    arrayFormat: 'comma',
  });

  let stringifyText = 'query=*';
  if (textInputs.length > 0) {
    stringifyText = queryString.stringify(
      { query: textInputs },
      {
        arrayFormat: 'comma',
      }
    );
  }

  return `http://localhost:8080/${baseUrl.replace(
    'limit=0',
    'limit=50'
  )}&${stringifyText}&${stringifyFacets}`;
};

/**
 * Fetch the search results using the ESG Search API.
 * https://github.com/ESGF/esgf.github.io/wiki/ESGF_Search_REST_API
 * @param {string} param0.baseUrl - Base url to perform queries
 * @param {arrayOf(string)} param0.textInputs - Free-text user input
 * @param {arrayOf(objectOf(arrayOf(string)))} param0.activeFacets - User applied facets

 */
export const fetchResults = async ([baseUrl, textInputs, activeFacets]) => {
  const qString = genUrlQuery(baseUrl, textInputs, activeFacets);
  return axios
    .get(qString)
    .then((res) => {
      return res.data;
    })
    .catch((error) => {
      throw new Error(error);
    });
};

/**
 * Performs process on citation objects.
 */
const processCitation = (citation) => {
  const newCitation = citation;
  newCitation.identifierDOI = `http://${newCitation.identifier.identifierType.toLowerCase()}.org/${
    newCitation.identifier.id
  }`;
  newCitation.creatorsList = newCitation.creators
    .map((elem) => elem.creatorName)
    .join('; ');

  return newCitation;
};
/**
 * Fetches citation data using a dataset's citation url.
 * NOTE: Local proxy used to bypass CORS (http://localhost:8080/)
 *  @param {string} url - Citation URL
 */
export const fetchCitation = async ({ url }) => {
  return axios
    .get(`http://localhost:8080/${url}`)
    .then((res) => {
      const citation = processCitation(res.data);
      return citation;
    })
    .catch((error) => {
      throw new Error(error);
    });
};
