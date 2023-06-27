/**
 * This file transforms environment variables into constants for re-usability.
 *
 * Make sure it is consistent with .envs/frontend, .react!
 */

// MetaGrid API
// ------------------------------------------------------------------------------
// https://github.com/aims-group/metagrid/tree/master/backend
export const metagridApiURL = `${
  process.env.REACT_APP_METAGRID_API_URL as string
}`;

// Redirect frontend
export const publicUrl = process.env.PUBLIC_URL;
export const previousPublicUrl = process.env.REACT_APP_PREVIOUS_URL as string;

// ESGF wget API
// ------------------------------------------------------------------------------
// https://github.com/ESGF/esgf-wget
export const wgetApiURL = process.env.REACT_APP_WGET_API_URL as string;

// ESGF Search API
// ------------------------------------------------------------------------------
// https://esgf.github.io/esg-search/ESGF_Search_RESTful_API.html
export const esgfNodeURL = `${process.env.REACT_APP_ESGF_NODE_URL as string}`;
export const esgfNodeURLNoProtocol = esgfNodeURL.split('//')[1];

// ESGF Node Status API
// ------------------------------------------------------------------------------
// https://github.com/ESGF/esgf-utils/blob/master/node_status/query_prom.py
export const nodeStatusURL = `${
  process.env.REACT_APP_ESGF_NODE_STATUS_URL as string
}`;

// react-hotjar
// ------------------------------------------------------------------------------
// https://github.com/abdalla/react-hotjar
export const hjid = (process.env.REACT_APP_HOTJAR_ID as unknown) as number;
export const hjsv = (process.env.REACT_APP_HOTJAR_SV as unknown) as number;

// Django Auth URLs
export const djangoLoginUrl = process.env.REACT_APP_DJANGO_LOGIN_URL as string;
export const djangoLogoutUrl = process.env
  .REACT_APP_DJANGO_LOGOUT_URL as string;
