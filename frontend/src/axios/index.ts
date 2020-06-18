import axios from 'axios';
import httpAdapter from 'axios/lib/adapters/http';
import { apiBaseUrl } from '../env';

export default axios.create({
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  adapter: httpAdapter,
  baseURL: apiBaseUrl,
});
