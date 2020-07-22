/**
 * This file sets up mock service worker with server-handlers for tests.
 *
 * Essentially, it creates a mock server that intercepts all requests and
 * handle it as if it were a real server.
 * https://kentcdodds.com/blog/stop-mocking-fetch
 */
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import handlers from './server-handlers';

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
const server = setupServer(...handlers);
export { server, rest };
