/**
 * This file contains server handlers for each API route.
 * The server handlers are consumed by mock-service-worker (msw) for tests.
 * The handlers can be overwritten in a test to mock behaviors such as a failed
 * HTTP response from an API (404).
 */
import { rest } from 'msw';
import apiRoutes from '../../api/routes';
import {
  ESGFSearchAPIFixture,
  globusEndpointFixture,
  globusTransferResponseFixture,
  projectsFixture,
  rawCitationFixture,
  rawNodeStatusFixture,
  rawUserCartFixture,
  stacSearchResultsFixture,
  userAuthFixture,
  userInfoFixture,
  userSearchQueriesFixture,
  userSearchQueryFixture,
} from './fixtures';
import { tempStorageGetMock, tempStorageSetMock } from './mockStorage';

const handlers = [
  rest.post(apiRoutes.keycloakAuth.path, async (_req, res, ctx) =>
    res(ctx.status(200), ctx.json(userAuthFixture()))
  ),
  rest.get(apiRoutes.globusAuth.path, async (_req, res, ctx) =>
    res(ctx.status(200), ctx.json(userAuthFixture()))
  ),
  rest.get(apiRoutes.globusSearchEndpoints.path, async (_req, res, ctx) => {
    // For testing multiple search results
    const data = new URLSearchParams(_req.url.search);

    const searchText = data.get('search_text')?.toLowerCase();

    // Depending on search text, give back results
    switch (searchText) {
      case null:
        return res(ctx.status(200), ctx.json([]));
      case 'lc public':
        return res(ctx.status(200), ctx.json([globusEndpointFixture()]));
      case 'multiple endpoints':
        return res(
          ctx.status(200),
          ctx.json([
            globusEndpointFixture(
              'endpoint1',
              'Endpoint 1',
              'GCSv5_mapped_collection',
              'id1234567',
              'ownerId123',
              'subscriptId123'
            ),
            globusEndpointFixture(
              'endpoint2',
              'Endpoint 2',
              'GCSv5_endpoint',
              'id2345678',
              'ownerId234',
              'subscriptId234',
              'path2'
            ),
            globusEndpointFixture(
              'endpoint3',
              'Endpoint 3',
              'unknown',
              'id1234567',
              'ownerId123',
              ''
            ),
          ])
        );
      case 'error404':
        return res(ctx.status(404), ctx.json({ error: 'search error.' }));
      default:
        return res(ctx.status(200), ctx.json([]));
    }
  }),
  rest.post(apiRoutes.globusTransfer.path, async (_req, res, ctx) =>
    res(ctx.status(200), ctx.json(globusTransferResponseFixture()))
  ),
  rest.get(apiRoutes.userInfo.path, async (_req, res, ctx) =>
    res(ctx.status(200), ctx.json(userInfoFixture()))
  ),
  rest.post(apiRoutes.tempStorageGet.path, async (_req, res, ctx) => {
    const data = _req.body as { dataKey: string; dataValue: unknown };
    if (data && data.dataKey) {
      const keyName = data.dataKey;

      const value: unknown = tempStorageGetMock(keyName);
      return res(ctx.status(200), ctx.json({ [keyName]: value }));
    }
    return res(ctx.status(400), ctx.json('Load failed!'));
  }),
  rest.post(apiRoutes.tempStorageSet.path, async (_req, res, ctx) => {
    const reqBody = _req.body as string;
    const data = JSON.parse(reqBody) as { dataKey: string; dataValue: unknown };
    if (data && data.dataKey && data.dataValue) {
      const keyName = data.dataKey;

      tempStorageSetMock(keyName, data.dataValue as string);
      return res(ctx.status(200), ctx.json({ data: 'Save success!' }));
    }
    return res(ctx.status(400), ctx.json({ data: 'Save failed!' }));
  }),
  rest.get(apiRoutes.userInfo.path, async (_req, res, ctx) =>
    res(ctx.status(200), ctx.json(userInfoFixture()))
  ),
  rest.get(apiRoutes.userCart.path, async (_req, res, ctx) =>
    res(ctx.status(200), ctx.json(rawUserCartFixture()))
  ),
  rest.patch(apiRoutes.userCart.path, async (_req, res, ctx) =>
    res(ctx.status(200), ctx.json(rawUserCartFixture()))
  ),
  rest.get(apiRoutes.userSearches.path, async (_req, res, ctx) =>
    res(ctx.status(200), ctx.json({ results: userSearchQueriesFixture() }))
  ),
  rest.post(apiRoutes.userSearches.path, async (_req, res, ctx) =>
    res(ctx.status(201), ctx.json(userSearchQueryFixture()))
  ),
  rest.delete(apiRoutes.userSearch.path, async (_req, res, ctx) => res(ctx.status(204))),
  rest.get(apiRoutes.projects.path, async (_req, res, ctx) =>
    res(ctx.status(200), ctx.json({ results: projectsFixture() }))
  ),
  rest.get(apiRoutes.esgfSearch.path, async (_req, res, ctx) =>
    res(ctx.status(200), ctx.json(ESGFSearchAPIFixture()))
  ),
  rest.post(apiRoutes.citation.path, async (_req, res, ctx) => {
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
  rest.post(apiRoutes.wget.path, async (_req, res, ctx) => res(ctx.status(200))),
  rest.get(apiRoutes.nodeStatus.path, async (_req, res, ctx) =>
    res(ctx.status(200), ctx.json(rawNodeStatusFixture()))
  ),
  rest.get(apiRoutes.introMarkdown.path, async (_req, res, ctx) =>
    res(ctx.status(200), ctx.body('Some Markdown'))
  ),
  rest.get(apiRoutes.esgfFacetsSTAC.path, async (_req, res, ctx) => {
    return res(ctx.status(200), ctx.json(stacSearchResultsFixture()));
  }),
  rest.get(apiRoutes.esgfSearchSTAC.path, async (_req, res, ctx) => {
    return res(ctx.status(200), ctx.json(stacSearchResultsFixture()));
  }),
  // Default fallback handler
  rest.get('*', async (req, res, ctx) => {
    // eslint-disable-next-line no-console
    // console.error(`Please add request handler for ${req.url.toString()}`);
    return res(ctx.status(500), ctx.json({ error: 'You must add request handler.' }));
  }),
];

export default handlers;
