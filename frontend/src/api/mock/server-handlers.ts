/**
 * This file contains server handlers for each API route.
 * The server handlers are consumed by mock-service-worker (msw) for tests.
 * The handlers can be overwritten in a test to mock behaviors such as a failed
 * HTTP response from an API (404).
 */
import { rest } from 'msw';
import apiRoutes from '../routes';
import {
  ESGFSearchAPIFixture,
  projectsFixture,
  rawCitationFixture,
  rawNodeStatusFixture,
  rawUserCartFixture,
  userAuthFixture,
  userInfoFixture,
  userSearchQueriesFixture,
  userSearchQueryFixture,
} from './fixtures';

const handlers = [
  rest.post(apiRoutes.keycloakAuth.path, (_req, res, ctx) =>
    res(ctx.status(200), ctx.json(userAuthFixture()))
  ),
  rest.post(apiRoutes.globusAuth.path, (_req, res, ctx) =>
    res(ctx.status(200), ctx.json(userAuthFixture()))
  ),
  rest.post(apiRoutes.globusTransfer.path, (_req, res, ctx) =>
    res(ctx.status(200), ctx.json(userAuthFixture()))
  ),
  rest.post(apiRoutes.tempStorageGet.path, (_req, res, ctx) => {
    res(ctx.status(200), ctx.json({ dataValue: 'testValue' }));
  }),
  rest.post(apiRoutes.tempStorageSet.path, (_req, res, ctx) =>
    res(ctx.status(200), ctx.json({ dataKey: 'test', dataValue: 'value' }))
  ),
  rest.get(apiRoutes.userInfo.path, (_req, res, ctx) =>
    res(ctx.status(200), ctx.json(userInfoFixture()))
  ),
  rest.get(apiRoutes.userCart.path, (_req, res, ctx) =>
    res(ctx.status(200), ctx.json(rawUserCartFixture()))
  ),
  rest.patch(apiRoutes.userCart.path, (_req, res, ctx) =>
    res(ctx.status(200), ctx.json(rawUserCartFixture()))
  ),
  rest.get(apiRoutes.userSearches.path, (_req, res, ctx) =>
    res(ctx.status(200), ctx.json({ results: userSearchQueriesFixture() }))
  ),
  rest.post(apiRoutes.userSearches.path, (_req, res, ctx) =>
    res(ctx.status(201), ctx.json(userSearchQueryFixture()))
  ),
  rest.delete(apiRoutes.userSearch.path, (_req, res, ctx) =>
    res(ctx.status(204))
  ),
  rest.get(apiRoutes.projects.path, (_req, res, ctx) =>
    res(ctx.status(200), ctx.json({ results: projectsFixture() }))
  ),
  rest.get(apiRoutes.esgfSearch.path, (_req, res, ctx) =>
    res(ctx.status(200), ctx.json(ESGFSearchAPIFixture()))
  ),
  rest.post(apiRoutes.citation.path, (_req, res, ctx) => {
    // For testing more than one set of creators
    const data = _req.body as { [key: string]: unknown };
    if (data && data.citurl) {
      const citationUrl = data.citurl;
      if (citationUrl === 'citation_a') {
        return res(
          ctx.status(200),
          ctx.json(
            rawCitationFixture({
              creators: [
                { creatorName: 'Bobby' },
                { creatorName: 'Tommy' },
                { creatorName: 'Joey' },
              ],
            })
          )
        );
      }
      /* istanbul ignore next */
      if (citationUrl === 'citation_b') {
        return res(
          ctx.status(200),
          ctx.json(
            rawCitationFixture({
              creators: [
                { creatorName: 'Bobby' },
                { creatorName: 'Tommy' },
                { creatorName: 'Timmy' },
                { creatorName: 'Joey' },
              ],
            })
          )
        );
      }
    }

    return res(ctx.status(200), ctx.json(rawCitationFixture()));
  }),
  rest.get(apiRoutes.wget.path, (_req, res, ctx) => res(ctx.status(200))),
  rest.get(apiRoutes.nodeStatus.path, (_req, res, ctx) =>
    res(ctx.status(200), ctx.json(rawNodeStatusFixture()))
  ),
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
