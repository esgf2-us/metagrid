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
 * Generate a URL to perform a GET request to the ESG Search API.
 * Query string parameters use the logical OR operator, so queries are inclusive.
 * NOTE: Local proxy used to bypass CORS (http://localhost:8080/)
 * @param {string} baseUrl - Base url to perform queries
 * @param {arrayOf(string)} textInputs - Free-text user input
 * @param {arrayOf(objectOf(arrayOf(string)))} activeFacets - User applied facets
 */
export const genUrlQuery = (baseUrl, textInputs, activeFacets, pagination) => {
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
  const offset =
    pagination.page > 1 ? (pagination.page - 1) * pagination.pageSize : 0;
  const newBaseUrl = baseUrl
    .replace('limit=0', `limit=${pagination.pageSize}`)
    .replace('offset=0', `offset=${offset}`);

  const url = `${newBaseUrl}&${stringifyText}&${stringifyFacets}`;
  return url;
};

/**
 * Fetch the search results using the ESG Search API.
 * https://github.com/ESGF/esgf.github.io/wiki/ESGF_Search_REST_API
 * @param {string} param0.baseUrl - Base url to perform queries
 * @param {arrayOf(string)} param0.textInputs - Free-text user input
 * @param {arrayOf(objectOf(arrayOf(string)))} param0.activeFacets - User applied facets

 */
export const fetchResults = async ([reqUrl]) => {
  return axios
    .get(`http://localhost:8080/${reqUrl}`)
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
export const processCitation = (citation) => {
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

/**
 * Fetches files for a dataset.
 * NOTE: Local proxy used to bypass CORS (http://localhost:8080/)
 *  @param {string} id - ID of the dataset
 */
export const fetchFiles = async ({ id }) => {
  const url = `https://esgf-node.llnl.gov/search_files/${id}//esgf-node.llnl.gov/?limit=10`;
  return axios
    .get(`http://localhost:8080/${url}`)
    .then((res) => {
      return res.data;
    })
    .catch((error) => {
      throw new Error(error);
    });
};
