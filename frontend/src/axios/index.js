import axios from 'axios';
import httpAdapter from 'axios/lib/adapters/http';

// TODO:: use environment variables, based on development environments
export default axios.create({
  // eslint-disable-next-line global-require
  adapter: httpAdapter,
  baseURL: 'http://localhost:8000',
});
