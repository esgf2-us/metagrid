import axios from 'axios';
import httpAdapter from 'axios/lib/adapters/http';

export default axios.create({
  // eslint-disable-next-line global-require
  adapter: httpAdapter,
  baseURL: `${process.env.REACT_APP_API_PROTOCOL}${process.env.REACT_APP_API_URL}:${process.env.REACT_APP_API_PORT}`,
});
