/**
 * This file contains HTTP Request functions.
 */
import humps from 'humps';
import queryString from 'query-string';

import axios from '../axios';
import apiRoutes from './routes';
import { proxyString } from '../env';

/**
 * Camelizes keys from a string that is parsed as JSON.
 * Arg 'res' is type string because axios's transFormResponse function attempts
 * to parse the response body using JSON.parse but fails.
 * https://github.com/axios/axios/issues/576
 * https://github.com/axios/axios/issues/430
 *
 * @param str
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const camelizeKeysFromString = (str: string): Record<string, any> => {
  return humps.camelizeKeys(JSON.parse(str));
};

/**
 * Fetches a user's cart.
 * HTTP Request Method: GET
 * HTTP Response Code: 200 OK
 */
export const fetchUserCart = async (
  pk: string,
  accessToken: string
): Promise<{
  results: RawUserCart;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}> => {
  return axios
    .get(`${apiRoutes.userCart.replace(':pk', pk)}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
    .then((res) => {
      return res.data as Promise<{
        results: RawUserCart;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        [key: string]: any;
      }>;
    })
    .catch((error) => {
      throw new Error(error);
    });
};

/**
 * Updates a user's cart.
 * HTTP Request Method: PATCH
 * HTTP Response Code: 200 OK
 */
export const updateUserCart = async (
  pk: string,
  accessToken: string,
  newUserCart: Cart
): Promise<{
  results: RawUserCart;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}> => {
  return axios
    .patch(
      `${apiRoutes.userCart.replace(':pk', pk)}`,
      { items: newUserCart },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )
    .then((res) => {
      return res.data as Promise<{
        results: RawUserCart;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        [key: string]: any;
      }>;
    })
    .catch((error) => {
      throw new Error(error);
    });
};

/**
 * Fetches a user's searches.
 * HTTP Request Method: GET
 * HTTP Response: 200 OK
 */
export const fetchUserSearches = async (
  accessToken: string
): Promise<{
  count: number;
  results: SavedSearch[];
}> => {
  return axios
    .get(apiRoutes.userSearches, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      transformResponse: (res: string) => {
        try {
          return camelizeKeysFromString(res);
        } catch (e) {
          return null;
        }
      },
    })
    .then((res) => {
      return res.data as Promise<{
        count: number;
        results: SavedSearch[];
      }>;
    })
    .catch((error) => {
      throw new Error(error);
    });
};

/**
 * Add a user's search.
 * HTTP Request Method: POST
 * HTTP Response Code: 201 Created
 */
export const addUserSearch = async (
  userPk: string,
  accessToken: string,
  payload: SavedSearch
): Promise<RawUserSearch> => {
  const decamelizedPayload = humps.decamelizeKeys({
    user: userPk,
    ...payload,
  });
  return axios
    .post(apiRoutes.userSearches, decamelizedPayload, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
    .then((res) => {
      return res.data as Promise<RawUserSearch>;
    })
    .catch((error) => {
      throw new Error(error);
    });
};

/**
 * Delete a user's search.
 * HTTP Request Method: DELETE
 * HTTP Response: 204 No Content
 */
export const deleteUserSearch = async (
  pk: string,
  accessToken: string
): Promise<''> => {
  return axios
    .delete(`${apiRoutes.userSearch.replace(':pk', pk)}`, {
      data: {},
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
    .then((res) => {
      return res.data as Promise<''>;
    })
    .catch((error) => {
      throw new Error(error);
    });
};

/**
 * Fetches a list of projects.
 * HTTP Request Method: GET
 * HTTP Response: 200 OK
 */
export const fetchProjects = async (): Promise<{
  results: Project[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}> => {
  return axios
    .get(apiRoutes.projects, {
      transformResponse: (res: string) => {
        try {
          return camelizeKeysFromString(res);
        } catch (e) {
          return null;
        }
      },
    })
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
 * Generate a URL to perform a GET request to the ESGF Search API.
 * Query string parameters use the logical OR operator, so queries are inclusive.
 */
export const genUrlQuery = (
  baseUrl: string,
  defaultFacets: DefaultFacets,
  activeFacets: ActiveFacets | Record<string, unknown>,
  textInputs: string[] | [],
  pagination: { page: number; pageSize: number }
): string => {
  const defaultFacetsStr = queryString.stringify(
    humps.decamelizeKeys(defaultFacets)
  );
  const activeFacetsStr = queryString.stringify(
    humps.decamelizeKeys(activeFacets),
    {
      arrayFormat: 'comma',
    }
  );

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

  const url = `${apiRoutes.esgfDatasets}?${newBaseUrl}&${defaultFacetsStr}&${stringifyText}&${activeFacetsStr}`;
  return url;
};

/**
 * Fetch the search results using the ESGF Search API.
 * HTTP Request Method: GET
 * HTTP Response: 200 OK
 *
 * This function can be called with either PromiseFn or DeferFn.
 * With PromiseFn, arguments are passed in as an object ({reqUrl: string}).
 * Source: https://docs.react-async.com/api/options#promisefn
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
 * Performs processing on citation objects.
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
 * HTTP Request Method: GET
 * HTTP Response: 200 OK
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
 * HTTP Request Method: GET
 * HTTP Response: 200 OK
 */
export const fetchFiles = async ({
  id,
}: {
  id: string;
}): // eslint-disable-next-line @typescript-eslint/no-explicit-any
Promise<{ [key: string]: any }> => {
  const url = `${apiRoutes.esgfFiles.replace(':id', id)}?limit=10`;
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

/**
 * Performs validation against the wget API to ensure a 200 response.
 *
 * If the API returns a 200, it returns the responseURL so the browser can open
 * the link.
 */
export const fetchWgetScript = async (
  ids: string[] | string
): Promise<string> => {
  const params = new URLSearchParams();

  if (Array.isArray(ids)) {
    ids.forEach((id: string) => {
      params.append('dataset_id', id);
    });
  } else {
    params.append('dataset_id', ids);
  }

  return axios
    .get(apiRoutes.wget, { params })
    .then((res) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      return res.request.responseURL as string;
    })
    .catch((error) => {
      throw new Error(error);
    });
};

/**
 * Sets the window location href to the specified URL.
 *
 * It removes the proxyString from the URL so the link can be access through
 * the browser.
 */
export const openDownloadURL = (url: string): void => {
  window.location.href = url.replace(`${proxyString}/`, '');
};
