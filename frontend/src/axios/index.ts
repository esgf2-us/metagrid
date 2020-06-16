import axios from 'axios';
import httpAdapter from 'axios/lib/adapters/http';

export default axios.create({
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  adapter: httpAdapter,
  baseURL: `${process.env.REACT_APP_API_PROTOCOL || 'http://'}${
    process.env.REACT_APP_API_URL || 'localhost'
  }:${process.env.REACT_APP_API_PORT || 8000}`,
});
