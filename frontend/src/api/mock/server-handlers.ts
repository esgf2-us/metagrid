/**
 * This file contains server handlers for each API route.
 * The server handlers are consumed by mock-service-worker (msw) for tests.
 * The handlers can be overwritten in a test to mock behaviors such as a failed
 * HTTP response from an API (404).
 */
import { rest } from 'msw';
import apiRoutes from '../routes';
import {
  citationFixture,
  esgSearchApiFixture,
  projectsFixture,
  savedSearchesFixture,
  savedSearchFixture,
  userAuthFixture,
  userCartFixture,
  userInfoFixture,
} from './fixtures';

const handlers = [
  rest.post(apiRoutes.keycloakAuth, (_req, res, ctx) => {
    return res(ctx.status(200), ctx.json(userAuthFixture() as unknown));
  }),
  rest.get(apiRoutes.userInfo, (_req, res, ctx) => {
    return res(ctx.status(200), ctx.json(userInfoFixture() as unknown));
  }),
  rest.get(apiRoutes.userCart, (_req, res, ctx) => {
    return res(ctx.status(200), ctx.json(userCartFixture() as unknown));
  }),
  rest.patch(apiRoutes.userCart, (_req, res, ctx) => {
    return res(ctx.status(200), ctx.json(userCartFixture() as unknown));
  }),
  rest.get(apiRoutes.userSearches, (_req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({ results: savedSearchesFixture() } as unknown)
    );
  }),
  rest.post(apiRoutes.userSearches, (_req, res, ctx) => {
    return res(ctx.status(201), ctx.json(savedSearchFixture() as unknown));
  }),
  rest.delete(apiRoutes.userSearch, (_req, res, ctx) => {
    return res(ctx.status(204));
  }),
  rest.get(apiRoutes.projects, (_req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({ results: projectsFixture() } as unknown)
    );
  }),
  rest.get(apiRoutes.esgfDatasets, (_req, res, ctx) => {
    return res(ctx.status(200), ctx.json(esgSearchApiFixture() as unknown));
  }),
  rest.get(apiRoutes.esgfFiles, (_req, res, ctx) => {
    return res(ctx.status(200), ctx.json(esgSearchApiFixture() as unknown));
  }),
  rest.get(apiRoutes.citation, (_req, res, ctx) => {
    return res(ctx.status(200), ctx.json(citationFixture() as unknown));
  }),
  rest.get(apiRoutes.wget, (_req, res, ctx) => {
    return res(ctx.status(200));
  }),
  // Default fallback handler
  rest.get('*', (req, res, ctx) => {
    // eslint-disable-next-line no-console
    console.error(`Please add request handler for ${req.url.toString()}`);
    return res(
      ctx.status(500),
      ctx.json({ error: 'You must add request handler.' } as unknown)
    );
  }),
];

export default handlers;
