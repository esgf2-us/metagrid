import queryString from 'query-string';

import axios from '../axios';

// Stringified version of proxy to be used for API calls
export const proxyString = `${process.env.REACT_APP_PROXY_PROTOCOL}${process.env.REACT_APP_PROXY_HOST}:${process.env.REACT_APP_PROXY_PORT}`;

export const nodeProtocol = `${process.env.REACT_APP_ESGF_NODE_PROTOCOL}`;
export const nodeUrl = `${process.env.REACT_APP_ESGF_NODE_URL}`;

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
  defaultFacets: DefaultFacets,
  activeFacets: ActiveFacets | {},
  textInputs: string[] | [],
  pagination: { page: number; pageSize: number }
): string => {
  const defaultFacetsStr = queryString.stringify(defaultFacets);
  const activeFacetsStr = queryString.stringify(activeFacets, {
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

  const url = `${nodeProtocol}${nodeUrl}/esg-search/search/?${newBaseUrl}&${defaultFacetsStr}&${stringifyText}&${activeFacetsStr}`;
  return url;
};

/**
 * Fetch the search results using the ESG Search API.
 * Source: https://github.com/ESGF/esgf.github.io/wiki/ESGF_Search_REST_API
 *
 * This function can be called with either PromiseFn or DeferFn.
 *
 * With PromiseFn, arguments are passed in as an object ({reqUrl: string}).
 * Source: https://docs.react-async.com/api/options#promisefn
 *
 * With DeferFn, arguments are passed in as an array ([string]).
 * Source: https://docs.react-async.com/api/options#deferfn
 */
export const fetchResults = async (
  args: [string] | Record<string, string>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<{ [key: string]: any }> => {
  let reqUrlStr;

  if (Array.isArray(args)) {
    // eslint-disable-next-line prefer-destructuring
    reqUrlStr = args[0];
  } else {
    reqUrlStr = args.reqUrl;
  }

  return axios
    .get(`${proxyString}/${reqUrlStr}`)
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
 * NOTE: Local proxy used to bypass CORS
 */
export const fetchCitation = async ({
  url,
}: {
  [key: string]: string;
}): // eslint-disable-next-line @typescript-eslint/no-explicit-any
Promise<{ [key: string]: any }> => {
  return axios
    .get(`${proxyString}/${url}`)
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
 * NOTE: Local proxy used to bypass CORS
 */
export const fetchFiles = async ({
  id,
}: {
  id: string;
}): // eslint-disable-next-line @typescript-eslint/no-explicit-any
Promise<{ [key: string]: any }> => {
  const url = `${nodeProtocol}${nodeUrl}/search_files/${id}/${nodeUrl}/?limit=10`;
  return axios
    .get(`${proxyString}/${url}`)
    .then((res) => {
      return res.data;
    })
    .catch((error) => {
      throw new Error(error);
    });
};
