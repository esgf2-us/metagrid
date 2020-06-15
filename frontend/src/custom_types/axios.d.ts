/**
 * Axios is not written in TypeScript, so the module needs to be defined manually.
 * Source: https://github.com/axios/axios/issues/2296
 */

declare module 'axios/lib/adapters/http' {
  import { Adapter } from 'axios';

  const HttpAdapter: Adapter;

  export default HttpAdapter;
}
