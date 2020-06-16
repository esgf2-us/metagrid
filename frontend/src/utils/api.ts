import queryString from 'query-string';

import axios from '../axios';
import { apiRoutes } from '../test/server-handlers';
import { proxyString } from '../env';

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
      return res.data as Promise<{
        results: Project[];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        [key: string]: any;
      }>;
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
  activeFacets: ActiveFacets | Record<string, unknown>,
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

  const url = `${apiRoutes.esgSearchDatasets}?${newBaseUrl}&${defaultFacetsStr}&${stringifyText}&${activeFacetsStr}`;
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
    .get(`${reqUrlStr}`)
    .then((res) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return res.data as Promise<{ [key: string]: any }>;
    })
    .catch((error) => {
      throw new Error(error);
    });
};

/**
 * Performs process on citation objects.
 */

export const processCitation = (citation: RawCitation): RawCitation => {
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
  const url = `${apiRoutes.esgSearchFiles.replace(':id', id)}?limit=10`;
  return axios
    .get(url)
    .then((res) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return res.data as Promise<{ [key: string]: any }>;
    })
    .catch((error) => {
      throw new Error(error);
    });
};
