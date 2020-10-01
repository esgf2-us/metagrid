/**
 * This file contains HTTP Request functions.
 */
import humps from 'humps';
import queryString from 'query-string';
import { splitURLByChar } from '../common/utils';
import {
  RawUserCart,
  RawUserSearchQuery,
  UserCart,
  UserSearchQueries,
  UserSearchQuery,
} from '../components/Cart/types';
import {
  ActiveFacets,
  DefaultFacets,
  RawProjects,
} from '../components/Facets/types';
import { RawCitation } from '../components/Search/types';
import { proxyURL } from '../env';
import axios from '../lib/axios';
import apiRoutes, { clickableRoute } from './routes';

/**
 * Must use JSON.parse on the 'str' arg string because axios's transformResponse
 * function attempts to parse the response body using JSON.parse but fails.
 * https://github.com/axios/axios/issues/576
 * https://github.com/axios/axios/issues/430
 *
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const camelizeKeysFromString = (str: string): Record<string, any> => {
  return humps.camelizeKeys(JSON.parse(str));
};

/**
 * This function removes the proxyString from the URL so the link can be accessed
 * through the browser.
 */
export const openDownloadURL = (url: string): void => {
  const newURL = clickableRoute(url);
  window.location.href = newURL;
};

/**
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
 * HTTP Request Method: PATCH
 * HTTP Response Code: 200 OK
 */
export const updateUserCart = async (
  pk: string,
  accessToken: string,
  newUserCart: UserCart
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
 * HTTP Request Method: GET
 * HTTP Response: 200 OK
 */
export const fetchUserSearchQueries = async (
  accessToken: string
): Promise<{
  count: number;
  results: UserSearchQueries;
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
        results: UserSearchQueries;
      }>;
    })
    .catch((error) => {
      throw new Error(error);
    });
};

/**
 * HTTP Request Method: POST
 * HTTP Response Code: 201 Created
 */
export const addUserSearchQuery = async (
  userPk: string,
  accessToken: string,
  payload: UserSearchQuery
): Promise<RawUserSearchQuery> => {
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
      return res.data as Promise<RawUserSearchQuery>;
    })
    .catch((error) => {
      throw new Error(error);
    });
};

/**
 * HTTP Request Method: DELETE
 * HTTP Response: 204 No Content
 */
export const deleteUserSearchQuery = async (
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
 * HTTP Request Method: GET
 * HTTP Response: 200 OK
 */
export const fetchProjects = async (): Promise<{
  results: RawProjects;
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
        results: RawProjects;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        [key: string]: any;
      }>;
    })
    .catch((error) => {
      throw new Error(error);
    });
};

/**
 * Query string parameters use the logical OR operator, so queries are inclusive.
 */
export const generateSearchURLQuery = (
  baseUrl: string,
  defaultFacets: DefaultFacets,
  activeFacets: ActiveFacets | Record<string, unknown>,
  textInputs: string[] | [],
  pagination: { page: number; pageSize: number }
): string => {
  const defaultFacetsStr = queryString.stringify(
    humps.decamelizeKeys(defaultFacets) as DefaultFacets
  );
  const activeFacetsStr = queryString.stringify(
    humps.decamelizeKeys(activeFacets) as ActiveFacets,
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
 * HTTP Request Method: GET
 * HTTP Response: 200 OK
 *
 * This function can be called with either PromiseFn or DeferFn.
 * With PromiseFn, arguments are passed in as an object ({reqUrl: string}).
 * Source: https://docs.react-async.com/api/options#promisefn
 * With DeferFn, arguments are passed in as an array ([string]).
 * Source: https://docs.react-async.com/api/options#deferfn
 */
export const fetchSearchResults = async (
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
 * HTTP Request Method: GET
 * HTTP Response: 200 OK
 */
export const fetchDatasetCitation = async ({
  url,
}: {
  [key: string]: string;
}): // eslint-disable-next-line @typescript-eslint/no-explicit-any
Promise<{ [key: string]: any }> => {
  return axios
    .get(`${proxyURL}/${url}`)
    .then((res) => {
      const citation = processCitation(res.data);
      return citation;
    })
    .catch((error) => {
      throw new Error(error);
    });
};

/**
 * HTTP Request Method: GET
 * HTTP Response: 200 OK
 */
export const fetchDatasetFiles = async ({
  id,
}: {
  id: string;
}): // eslint-disable-next-line @typescript-eslint/no-explicit-any
Promise<{ [key: string]: any }> => {
  // The dataset's source node is contained in its id, so strip the URL suffix.
  const sourceNodeURL = splitURLByChar(id, '|', 'second');

  const url = `${apiRoutes.esgfFiles
    .replace(':datasetID', id)
    .replace(':sourceNode', sourceNodeURL)}`;

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
  const url = queryString.stringifyUrl({
    url: apiRoutes.wget,
    query: { dataset_id: ids },
  });
  return axios
    .get(url)
    .then(() => {
      return url;
    })
    .catch((error) => {
      throw new Error(error);
    });
};
