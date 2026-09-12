/**
 * This file contains server handlers for each API route.
 * The server handlers are consumed by mock-service-worker (msw) for tests.
 * The handlers can be overwritten in a test to mock behaviors such as a failed
 * HTTP response from an API (404).
 */
import { http, HttpResponse } from 'msw';
import apiRoutes from '../../api/routes';
import {
  ESGFSearchAPIFixture,
  globusEndpointFixture,
  globusTransferResponseFixture,
  projectsFixture,
  rawCitationFixture,
  rawNodeStatusFixture,
  rawUserCartFixture,
  stacAggregationsFixture,
  stacSearchResultsFixture,
  userAuthFixture,
  userInfoFixture,
  userSearchQueriesFixture,
  userSearchQueryFixture,
} from './fixtures';
import { tempStorageGetMock, tempStorageSetMock } from './mockStorage';

const handlers = [
  http.post(apiRoutes.keycloakAuth.path, async () =>
    HttpResponse.json(userAuthFixture(), { status: 200 }),
  ),
  http.get(apiRoutes.globusAuth.path, async () =>
    HttpResponse.json(userAuthFixture(), { status: 200 }),
  ),
  http.get(apiRoutes.globusResetTokens.path, async () =>
    HttpResponse.json({ status: 'success', message: 'Tokens reset successfully.' }, { status: 200 }),
  ),
  http.get(apiRoutes.globusSearchEndpoints.path, async ({ request }) => {
    // For testing multiple search results
    const url = new URL(request.url);
    const searchText = url.searchParams.get('search_text')?.toLowerCase();

    // Depending on search text, give back results
    switch (searchText) {
      case null:
        return HttpResponse.json([], { status: 200 });
      case 'lc public':
        return HttpResponse.json([globusEndpointFixture()], { status: 200 });
      case 'multiple endpoints':
        return HttpResponse.json(
          [
            globusEndpointFixture({
              canonical_name: 'endpoint1',
              display_name: 'Endpoint 1',
              entity_type: 'GCSv5_mapped_collection',
              id: 'id1234567',
              owner_id: 'ownerId123',
              subscription_id: 'subscriptId123',
            }),
            globusEndpointFixture({
              canonical_name: 'endpoint2',
              display_name: 'Endpoint 2',
              entity_type: 'GCSv5_endpoint',
              id: 'id2345678',
              owner_id: 'ownerId234',
              subscription_id: 'subscriptId234',
              path: 'path2',
            }),
            globusEndpointFixture({
              canonical_name: 'endpoint3',
              display_name: 'Endpoint 3',
              entity_type: 'unknown',
              id: 'id1234567',
              owner_id: 'ownerId123',
              subscription_id: '',
            }),
          ],
          { status: 200 },
        );
      case 'error404':
        return HttpResponse.json({ error: 'search error.' }, { status: 404 });
      default:
        return HttpResponse.json([], { status: 200 });
    }
  }),
  http.post(apiRoutes.globusTransfer.path, async () =>
    HttpResponse.json(globusTransferResponseFixture(), { status: 200 }),
  ),
  http.get(apiRoutes.userInfo.path, async () =>
    HttpResponse.json(userInfoFixture(), { status: 200 }),
  ),
  http.post(apiRoutes.tempStorageGet.path, async ({ request }) => {
    const data = (await request.json()) as { dataKey: string; dataValue: unknown };
    if (data && data.dataKey) {
      const keyName = data.dataKey;

      const value: unknown = tempStorageGetMock(keyName);
      return HttpResponse.json({ [keyName]: value }, { status: 200 });
    }
    return HttpResponse.json('Load failed!', { status: 400 });
  }),
  http.post(apiRoutes.tempStorageSet.path, async ({ request }) => {
    const reqBody = await request.text();
    const data = JSON.parse(reqBody) as { dataKey: string; dataValue: unknown };
    if (data && data.dataKey && data.dataValue) {
      const keyName = data.dataKey;

      tempStorageSetMock(keyName, data.dataValue as string);
      return HttpResponse.json({ data: 'Save success!' }, { status: 200 });
    }
    return HttpResponse.json({ data: 'Save failed!' }, { status: 400 });
  }),
  http.get(apiRoutes.userInfo.path, async () =>
    HttpResponse.json(userInfoFixture(), { status: 200 }),
  ),
  http.get(apiRoutes.userCart.path, async () =>
    HttpResponse.json(rawUserCartFixture(), { status: 200 }),
  ),
  http.patch(apiRoutes.userCart.path, async () =>
    HttpResponse.json(rawUserCartFixture(), { status: 200 }),
  ),
  http.get(apiRoutes.userSearches.path, async () =>
    HttpResponse.json({ results: userSearchQueriesFixture() }, { status: 200 }),
  ),
  http.post(apiRoutes.userSearches.path, async () =>
    HttpResponse.json(userSearchQueryFixture(), { status: 201 }),
  ),
  http.delete(apiRoutes.userSearch.path, async () => new HttpResponse(null, { status: 204 })),
  http.get(apiRoutes.projects.path, async () =>
    HttpResponse.json({ results: projectsFixture() }, { status: 200 }),
  ),
  http.get(apiRoutes.esgfSearch.path, async () =>
    HttpResponse.json(ESGFSearchAPIFixture(), { status: 200 }),
  ),
  http.post(apiRoutes.citation.path, async ({ request }) => {
    // For testing more than one set of creators
    const data = (await request.json()) as { [key: string]: unknown };
    if (data && data.citurl) {
      const citationUrl = data.citurl;
      if (citationUrl === 'citation_a') {
        return HttpResponse.json(
          rawCitationFixture({
            creators: [
              { creatorName: 'Bobby' },
              { creatorName: 'Tommy' },
              { creatorName: 'Joey' },
            ],
          }),
          { status: 200 },
        );
      }
      /* istanbul ignore next -- @preserve */
      if (citationUrl === 'citation_b') {
        return HttpResponse.json(
          rawCitationFixture({
            creators: [
              { creatorName: 'Bobby' },
              { creatorName: 'Tommy' },
              { creatorName: 'Timmy' },
              { creatorName: 'Joey' },
            ],
          }),
          { status: 200 },
        );
      }
    }

    return HttpResponse.json(rawCitationFixture(), { status: 200 });
  }),
  http.post(apiRoutes.wget.path, async () => new HttpResponse(null, { status: 200 })),
  http.get(apiRoutes.nodeStatus.path, async () =>
    HttpResponse.json(rawNodeStatusFixture(), { status: 200 }),
  ),
  http.get(apiRoutes.introMarkdown.path, async () =>
    HttpResponse.text('Some Markdown', { status: 200 }),
  ),
  http.get(apiRoutes.esgfSearchSTAC.path, async () => {
    return HttpResponse.json(stacSearchResultsFixture(), { status: 200 });
  }),
  http.post(apiRoutes.esgfSearchSTAC.path, async () => {
    return HttpResponse.json(stacSearchResultsFixture().search, { status: 200 });
  }),
  http.get(apiRoutes.esgfAggregationsSTAC.path, async () => {
    return HttpResponse.json(stacAggregationsFixture(), { status: 200 });
  }),
  http.post(apiRoutes.esgfAggregationsSTAC.path, async () => {
    return HttpResponse.json(stacAggregationsFixture(), { status: 200 });
  }),
  http.get('/projects/projects.json', async () => {
    // Return a valid empty config (tests will use default projects)
    return HttpResponse.json(
      {
        additionalProjects: [],
        whitelist: [],
        blacklist: [],
      },
      { status: 200 },
    );
  }),
  // Default fallback handler
  http.get('*', async () => {
    // console.error(`Please add request handler for ${req.url.toString()}`);
    return HttpResponse.json({ error: 'You must add request handler.' }, { status: 500 });
  }),
];

export default handlers;
