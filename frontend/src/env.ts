// This file sets environment variables as constants to be used in other files

const apiProtocol = process.env.REACT_APP_API_PROTOCOL as string;
const apiUrl = process.env.REACT_APP_API_URL as string;
const apiPort = process.env.REACT_APP_API_PORT as string;
export const apiBaseUrl = `${apiProtocol}${apiUrl}:${apiPort}`;

const proxyProtocol = process.env.REACT_APP_PROXY_PROTOCOL as string;
const proxyHost = process.env.REACT_APP_PROXY_HOST as string;
const proxyPort = process.env.REACT_APP_PROXY_PORT as string;
export const proxyString = `${proxyProtocol}${proxyHost}:${proxyPort}`;

export const nodeProtocol = `${
  process.env.REACT_APP_ESGF_NODE_PROTOCOL as string
}`;
export const nodeUrl = `${process.env.REACT_APP_ESGF_NODE_URL as string}`;
export const nodeRoute = `${nodeProtocol}${nodeUrl}`;
