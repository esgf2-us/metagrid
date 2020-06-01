import queryString from 'query-string';

import axios from '../axios';

/**
 * Fetches a list of projects.
 * NOTE: Uses the axios baseURL
 */
export const fetchProjects = async (): Promise<{
  results: Project[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}> => {
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
export const fetchResults = async (
  reqUrl: string
): // eslint-disable-next-line @typescript-eslint/no-explicit-any
Promise<{ [key: string]: any }> => {
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
export const fetchCitation = async ({
  url,
}: {
  [key: string]: string;
}): // eslint-disable-next-line @typescript-eslint/no-explicit-any
Promise<{ [key: string]: any }> => {
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
export const fetchFiles = async ({
  id,
}: {
  id: string;
}): // eslint-disable-next-line @typescript-eslint/no-explicit-any
Promise<{ [key: string]: any }> => {
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
