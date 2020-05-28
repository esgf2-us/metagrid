import queryString from 'query-string';
import { PromiseFn } from 'react-async';

import axios from '../axios';

/**
 * Fetches a list of projects.
 * NOTE: Uses the axios baseURL
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const fetchProjects: PromiseFn<any> = async () => {
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

 */
export const genUrlQuery = (
  baseUrl: string,
  textInputs: string[] | [],
  activeFacets: { [key: string]: string[] } | {},
  pagination: { page: number; pageSize: number }
): string => {
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

 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const fetchResults: PromiseFn<any> = async (reqUrl) => {
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

type Citation = {
  identifier: { id: string; identifierType: string };
  creators: { [key: string]: string }[];
  titles: string;
  publisher: string;
  publicationYear: number;
  identifierDOI: string;
  creatorsList: string;
};

export const processCitation = (citation: Citation): Citation => {
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
 */
export const fetchCitation: PromiseFn<Citation> = async ({ url }) => {
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
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const fetchFiles: PromiseFn<any> = async ({ id }) => {
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
