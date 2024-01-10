import axios, { AxiosAdapter } from 'axios';
import httpAdapter from 'axios/lib/adapters/http';
import { metagridApiURL } from '../../env';

export default axios.create({
  adapter: httpAdapter as AxiosAdapter,
  baseURL: metagridApiURL,
  // When a "cross-origin" request happens, the "Origin" request header is set by the browser.
  // However, in this case, the browser does not because the initial request is "same-origin".
  // https://github.com/Rob--W/cors-anywhere/issues/7#issuecomment-354740387
  // Manually add XMLHttpRequest to bypass this.
  // https://github.com/Rob--W/cors-anywhere/issues/39#issuecomment-387690291
  // https://github.com/Rob--W/cors-anywhere/pull/145#issuecomment-450528241
  headers: { 'X-Requested-With': 'XMLHttpRequest' },
  withCredentials: true,
});
