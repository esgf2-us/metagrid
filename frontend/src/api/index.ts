/**
 * This file contains HTTP Request functions.
 */
import { Subscription } from 'esgf-subscriptions';
import humps from 'humps';
import queryString from 'query-string';
import {
  RawUserCart,
  RawUserSearchQuery,
  UserCart,
  UserSearchQueries,
  UserSearchQuery,
} from '../components/Cart/types';
import { ActiveFacets, RawProjects } from '../components/Facets/types';
import { NodeStatusArray, RawNodeStatus } from '../components/NodeStatus/types';
import {
  ActiveSearchQuery,
  Pagination,
  RawCitation,
  ResultType,
  TextInputs,
} from '../components/Search/types';
import { RawUserAuth, RawUserInfo } from '../contexts/types';
import { proxyURL } from '../env';
import axios from '../lib/axios';
import apiRoutes, { ApiRoute, clickableRoute, HTTPCodeType } from './routes';

export interface ResponseError extends Error {
  status?: number;
  response: { status: HTTPCodeType; [key: string]: string | HTTPCodeType };
}

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
 * https://github.com/axios/axios#handling-errors
 */
export const errorMsgBasedOnHTTPStatusCode = (
  error: ResponseError,
  route: ApiRoute
): string => {
  // Indicates that an HTTP response status code was returned from the server
  if (error.response) {
    return route.handleErrorMsg(error.response.status);
  }

  // A connection could not be established, so return a generic error message
  return route.handleErrorMsg('generic');
};

/**
 * HTTP Request Method: POST
 * HTTP Response Code: 200 OK
 */
export const fetchUserAuth = async (args: [string]): Promise<RawUserAuth> => {
  return axios
    .post(apiRoutes.keycloakAuth.path, { access_token: args[0] })
    .then((res) => {
      return res.data as Promise<RawUserAuth>;
    })
    .catch((error) => {
      throw new Error(
        errorMsgBasedOnHTTPStatusCode(error, apiRoutes.keycloakAuth)
      );
    });
};

/**
 * HTTP Request Method: GET
 * HTTP Response Code: 200 OK
 */
export const fetchUserInfo = async (args: [string]): Promise<RawUserInfo> => {
  return axios
    .get(apiRoutes.userInfo.path, {
      headers: {
        Authorization: `Bearer ${args[0]}`,
      },
    })
    .then((res) => {
      return res.data as Promise<RawUserInfo>;
    })
    .catch((error) => {
      throw new Error(errorMsgBasedOnHTTPStatusCode(error, apiRoutes.userInfo));
    });
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
    .get(`${apiRoutes.userCart.path.replace(':pk', pk)}`, {
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
    .catch((error: ResponseError) => {
      throw new Error(errorMsgBasedOnHTTPStatusCode(error, apiRoutes.userCart));
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
      `${apiRoutes.userCart.path.replace(':pk', pk)}`,
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
    .catch((error: ResponseError) => {
      throw new Error(errorMsgBasedOnHTTPStatusCode(error, apiRoutes.userCart));
    });
};

/**
 * HTTP Request Method: GET
 * HTTP Response Code: 200 OK
 */
export const fetchUserSubscriptions = async (
  pk: string,
  accessToken: string
): Promise<{
  subscriptions: Subscription[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}> => {
  return axios
    .get(`${apiRoutes.userSubscriptions.path.replace(':pk', pk)}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
    .then((res) => {
      return res.data as Promise<{
        subscriptions: Subscription[];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        [key: string]: any;
      }>;
    })
    .catch((error: ResponseError) => {
      throw new Error(
        errorMsgBasedOnHTTPStatusCode(error, apiRoutes.userSubscriptions)
      );
    });
};

/**
 * HTTP Request Method: GET
 * HTTP Response Code: 200 OK
 */
export const updateUserSubscriptions = async (
  pk: string,
  accessToken: string,
  newSubscriptions: Subscription[]
): Promise<{
  subscriptions: Subscription[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}> => {
  return axios
    .patch(
      `${apiRoutes.userSubscriptions.path.replace(':pk', pk)}`,
      { subscriptions: newSubscriptions },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )
    .then((res) => {
      return res.data as Promise<{
        subscriptions: Subscription[];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        [key: string]: any;
      }>;
    })
    .catch((error: ResponseError) => {
      throw new Error(
        errorMsgBasedOnHTTPStatusCode(error, apiRoutes.userSubscriptions)
      );
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
    .get(apiRoutes.userSearches.path, {
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
    .catch((error: ResponseError) => {
      throw new Error(
        errorMsgBasedOnHTTPStatusCode(error, apiRoutes.userSearches)
      );
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
    .post(apiRoutes.userSearches.path, decamelizedPayload, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
    .then((res) => {
      return res.data as Promise<RawUserSearchQuery>;
    })
    .catch((error: ResponseError) => {
      throw new Error(
        errorMsgBasedOnHTTPStatusCode(error, apiRoutes.userSearches)
      );
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
    .delete(`${apiRoutes.userSearch.path.replace(':pk', pk)}`, {
      data: {},
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
    .then((res) => {
      return res.data as Promise<''>;
    })
    .catch((error: ResponseError) => {
      throw new Error(
        errorMsgBasedOnHTTPStatusCode(error, apiRoutes.userSearch)
      );
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
    .get(apiRoutes.projects.path, {
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
    .catch((error: ResponseError) => {
      throw new Error(errorMsgBasedOnHTTPStatusCode(error, apiRoutes.projects));
    });
};

/**
 * replica param indicates whether the record is the 'master' copy, or a replica.
 * - By default, no replica param is specified (return both replicas and originals)
 * - replica=false to return only originals
 * - replica=true to return only replicas
 *
 * https://github.com/ESGF/esgf.github.io/wiki/ESGF_Search_REST_API#core-facets
 */
export const convertResultTypeToReplicaParam = (
  resultType: ResultType,
  isLabel?: boolean
): string | undefined => {
  const replicaParams = {
    all: undefined,
    'originals only': 'replica=false',
    'replicas only': 'replica=true',
  };

  const param = replicaParams[resultType] as ResultType;
  return param && isLabel ? param.replace('=', ' = ') : param;
};

export const updatePaginationParams = (
  url: string,
  pagination: Pagination
): string => {
  const paginationOffset =
    pagination.page > 1 ? (pagination.page - 1) * pagination.pageSize : 0;

  const baseParams = url
    .replace('limit=0', `limit=${pagination.pageSize}`)
    .replace('offset=0', `offset=${paginationOffset}`);

  return `${baseParams}&`;
};

/**
 * Query string parameters use the logical OR operator, so queries are inclusive.
 *
 * Example output: https://esgf-node.llnl.gov/esg-search/search/?replica=false&offset=0&limit=10&query=foo&baz=option1&foo=option1
 */
export const generateSearchURLQuery = (
  activeSearchQuery: ActiveSearchQuery | UserSearchQuery,
  pagination: { page: number; pageSize: number }
): string => {
  const {
    project,
    resultType,
    minVersionDate,
    maxVersionDate,
    activeFacets,
    textInputs,
  } = activeSearchQuery;
  const baseRoute = `${apiRoutes.esgfSearch.path}?`;
  const replicaParam = convertResultTypeToReplicaParam(resultType);

  // The base params include facet fields to return for each dataset and the pagination options
  let baseParams = updatePaginationParams(
    project.facetsUrl as string,
    pagination
  );

  if (replicaParam) {
    baseParams += `${replicaParam}&`;
  }
  if (minVersionDate) {
    baseParams += `min_version=${minVersionDate}&`;
  }
  if (maxVersionDate) {
    baseParams += `max_version=${maxVersionDate}&`;
  }

  let textInputsParams = 'query=*';
  if (textInputs.length > 0) {
    textInputsParams = queryString.stringify(
      { query: textInputs },
      {
        arrayFormat: 'comma',
      }
    );
  }

  const activeFacetsParams = queryString.stringify(
    humps.decamelizeKeys(activeFacets) as ActiveFacets,
    {
      arrayFormat: 'comma',
    }
  );

  return `${baseRoute}${baseParams}${textInputsParams}&${activeFacetsParams}`;
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
    .catch((error: ResponseError) => {
      throw new Error(
        errorMsgBasedOnHTTPStatusCode(error, apiRoutes.esgfSearch)
      );
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
}): Promise<{ [key: string]: unknown }> => {
  return axios
    .get(`${proxyURL}/${url}`)
    .then((res) => {
      const citation = processCitation(res.data);
      return citation;
    })
    .catch((error: ResponseError) => {
      throw new Error(errorMsgBasedOnHTTPStatusCode(error, apiRoutes.citation));
    });
};

export type FetchDatasetFilesProps = {
  id: string;
  paginationOptions: Pagination;
  filenameVars?: TextInputs | [];
};

/**
 * HTTP Request Method: GET
 * HTTP Response: 200 OK
 *
 * This function is invokved by react-async package's deferFn method.
 * https://docs.react-async.com/api/options#deferfn
 *
 * Example output: https://esgf-node.llnl.gov/esg-search/search/?dataset_id=cmip5.output1.BCC.bcc-csm1-1.abrupt4xCO2.mon.ocean.Omon.r2i1p1.v20120202%7Caims3.llnl.gov&format=application%2Fsolr%2Bjson&type=File&query=hfds,Omon
 */
export const fetchDatasetFiles = async (
  _args: [],
  props: FetchDatasetFilesProps
): Promise<{ [key: string]: unknown }> => {
  const { id, paginationOptions, filenameVars } = props;
  const queryParams: {
    format: string;
    type: 'File';
    offset: number;
    limit: number;
    dataset_id: string;
    query?: string[];
  } = {
    format: 'application/solr+json',
    type: 'File',
    offset: 0,
    limit: 0,
    dataset_id: id,
  };

  if (filenameVars && filenameVars.length > 0) {
    queryParams.query = filenameVars;
  }

  let url = queryString.stringifyUrl(
    {
      url: apiRoutes.esgfSearch.path,
      query: queryParams,
    },
    { arrayFormat: 'comma' }
  );
  url = updatePaginationParams(url, paginationOptions);

  return axios
    .get(url)
    .then((res) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return res.data as Promise<{ [key: string]: any }>;
    })
    .catch((error: ResponseError) => {
      throw new Error(
        errorMsgBasedOnHTTPStatusCode(error, apiRoutes.esgfSearch)
      );
    });
};
/**
 * Performs validation against the wget API to ensure a 200 response.
 *
 * If the API returns a 200, it returns the responseURL so the browser can open
 * the link.
 */
export const fetchWgetScript = async (
  ids: string[] | string,
  filenameVars?: string[]
): Promise<string> => {
  let url = queryString.stringifyUrl({
    url: apiRoutes.wget.path,
    query: { dataset_id: ids },
  });

  if (filenameVars && filenameVars.length > 0) {
    const filenameVarsParam = queryString.stringify(
      { query: filenameVars },
      {
        arrayFormat: 'comma',
      }
    );
    url += `&${filenameVarsParam}`;
  }

  return axios
    .get(url)
    .then(() => {
      return url;
    })
    .catch((error: ResponseError) => {
      throw new Error(errorMsgBasedOnHTTPStatusCode(error, apiRoutes.wget));
    });
};

/**
 * Parses the results of the node status API to simplify the data structure.
 */
export const parseNodeStatus = (res: RawNodeStatus): NodeStatusArray => {
  const parsedRes = [] as NodeStatusArray;

  res.data.result.forEach((node) => {
    const { instance, target: source } = node.metric;
    const [epochTimestamp, isOnline] = node.value;

    const timestamp = new Date(epochTimestamp * 1000).toUTCString();

    parsedRes.push({
      name: instance,
      source,
      timestamp,
      isOnline: Boolean(Number(isOnline)),
    });
  });

  parsedRes.sort((a, b) => a.name.localeCompare(b.name));

  return parsedRes;
};

/**
 * HTTP Request Method: GET
 * HTTP Response: 200 OK
 */
export const fetchNodeStatus = async (): Promise<NodeStatusArray> => {
  return axios
    .get(`${apiRoutes.nodeStatus.path}`)
    .then((res) => {
      return parseNodeStatus(res.data as RawNodeStatus);
    })
    .catch((error: ResponseError) => {
      throw new Error(
        errorMsgBasedOnHTTPStatusCode(error, apiRoutes.nodeStatus)
      );
    });
};
