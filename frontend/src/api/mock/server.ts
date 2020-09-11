/**
 * This file sets up mock service worker with server-handlers for tests.
 *
 * Essentially, it creates a mock server that intercepts all requests and
 * handle it as if it were a real server.
 * https://kentcdodds.com/blog/stop-mocking-fetch
 */
import { rest } from 'msw';
import { RequestHandlersList } from 'msw/lib/types/setupWorker/glossary';
import { setupServer } from 'msw/node';
import handlers from './server-handlers';

const server = setupServer(...(handlers as RequestHandlersList));
export { server, rest };
