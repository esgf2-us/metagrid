import axios from 'axios';

// TODO:: use environment variables, based on development environments
export default axios.create({
  baseURL: 'http://localhost:8000',
});
