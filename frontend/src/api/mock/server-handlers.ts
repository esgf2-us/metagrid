/**
 * This file contains server handlers for each API route.
 * The server handlers are consumed by mock-service-worker (msw) for tests.
 * The handlers can be overwritten in a test to mock behaviors such as a failed
 * HTTP response from an API (404).
 */
import { rest } from 'msw';
import {
  citationFixture,
  esgSearchApiFixture,
  projectsFixture,
  savedSearchFixture,
  savedSearchesFixture,
  userAuthFixture,
  userInfoFixture,
  userCartFixture,
} from './fixtures';
import apiRoutes from '../routes';

const handlers = [
  rest.post(apiRoutes.keycloakAuth, (_req, res, ctx) => {
    return res(ctx.status(200), ctx.json(userAuthFixture()));
  }),
  rest.get(apiRoutes.userInfo, (_req, res, ctx) => {
    return res(ctx.status(200), ctx.json(userInfoFixture()));
  }),
  rest.get(apiRoutes.userCart, (_req, res, ctx) => {
    return res(ctx.status(200), ctx.json(userCartFixture()));
  }),
  rest.patch(apiRoutes.userCart, (_req, res, ctx) => {
    return res(ctx.status(200), ctx.json(userCartFixture()));
  }),
  rest.get(apiRoutes.userSearches, (_req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ results: savedSearchesFixture() }));
  }),
  rest.post(apiRoutes.userSearches, (_req, res, ctx) => {
    return res(ctx.status(201), ctx.json(savedSearchFixture()));
  }),
  rest.delete(apiRoutes.userSearch, (_req, res, ctx) => {
    return res(ctx.status(204));
  }),
  rest.get(apiRoutes.projects, (_req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ results: projectsFixture() }));
  }),
  rest.get(apiRoutes.esgfDatasets, (_req, res, ctx) => {
    return res(ctx.status(200), ctx.json(esgSearchApiFixture()));
  }),
  rest.get(apiRoutes.esgfFiles, (_req, res, ctx) => {
    return res(ctx.status(200), ctx.json(esgSearchApiFixture()));
  }),
  rest.get(apiRoutes.citation, (_req, res, ctx) => {
    return res(ctx.status(200), ctx.json(citationFixture()));
  }),
  // Default fallback handler
  rest.get('*', (req, res, ctx) => {
    // eslint-disable-next-line no-console
    console.error(`Please add request handler for ${req.url.toString()}`);
    return res(
      ctx.status(500),
      ctx.json({ error: 'You must add request handler.' })
    );
  }),
];

export default handlers;
