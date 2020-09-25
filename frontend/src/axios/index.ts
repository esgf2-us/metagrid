import axios, { AxiosAdapter } from 'axios';
import httpAdapter from 'axios/lib/adapters/http';
import { metagridApiURL } from '../env';

export default axios.create({
  adapter: httpAdapter as AxiosAdapter,
  baseURL: metagridApiURL,
});
