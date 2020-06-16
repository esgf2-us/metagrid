// test/server.js
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import handlers from './server-handlers';

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
const server = setupServer(...handlers);
export { server, rest };
