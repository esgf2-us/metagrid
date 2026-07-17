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
  http.post(apiRoutes.keycloakAuth.path, () => {
    return HttpResponse.json(userAuthFixture());
  }),

  http.get(apiRoutes.globusAuth.path, () => {
    return HttpResponse.json(userAuthFixture());
  }),

  http.get(apiRoutes.globusResetTokens.path, () => {
    return HttpResponse.json({ status: 'success', message: 'Tokens reset successfully.' });
  }),

  http.get(apiRoutes.globusSearchEndpoints.path, ({ request }) => {
    const url = new URL(request.url);
    const searchText = url.searchParams.get('search_text')?.toLowerCase();

    switch (searchText) {
      case null:
        return HttpResponse.json([]);
      case 'lc public':
        return HttpResponse.json([globusEndpointFixture()]);
      case 'multiple endpoints':
        return HttpResponse.json([
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
        ]);
      case 'error404':
        return HttpResponse.json({ error: 'search error.' }, { status: 404 });
      default:
        return HttpResponse.json([]);
    }
  }),

  http.post(apiRoutes.globusTransfer.path, () => {
    return HttpResponse.json(globusTransferResponseFixture());
  }),

  http.get(apiRoutes.userInfo.path, () => {
    return HttpResponse.json(userInfoFixture());
  }),

  http.post(apiRoutes.tempStorageGet.path, async ({ request }) => {
    const data = (await request.json()) as { dataKey: string; dataValue: unknown };
    if (data && data.dataKey) {
      const keyName = data.dataKey;
      const value: unknown = tempStorageGetMock(keyName);
      return HttpResponse.json({ [keyName]: value });
    }
    return new HttpResponse('Load failed!', { status: 400 });
  }),

  http.post(apiRoutes.tempStorageSet.path, async ({ request }) => {
    // Note: If you were previously sending a raw string and parsing it, 
    // request.json() is preferred if the client sends application/json.
    try {
      const data = (await request.json()) as { dataKey: string; dataValue: unknown };
      if (data && data.dataKey && data.dataValue) {
        tempStorageSetMock(data.dataKey, data.dataValue as string);
        return HttpResponse.json({ data: 'Save success!' });
      }
    } catch (e) {
      // Fallback or error handling for invalid JSON
    }
    return HttpResponse.json({ data: 'Save failed!' }, { status: 400 });
  }),

  http.get(apiRoutes.userCart.path, () => {
    return HttpResponse.json(rawUserCartFixture());
  }),

  http.patch(apiRoutes.userCart.path, () => {
    return HttpResponse.json(rawUserCartFixture());
  }),

  http.get(apiRoutes.userSearches.path, () => {
    return HttpResponse.json({ results: userSearchQueriesFixture() });
  }),

  http.post(apiRoutes.userSearches.path, () => {
    return HttpResponse.json(userSearchQueryFixture(), { status: 201 });
  }),

  http.delete(apiRoutes.userSearch.path, () => {
    return new HttpResponse(null, { status: 204 });
  }),

  http.get(apiRoutes.projects.path, () => {
    return HttpResponse.json({ results: projectsFixture() });
  }),

  http.get(apiRoutes.esgfSearch.path, () => {
    return HttpResponse.json(ESGFSearchAPIFixture());
  }),

  http.post(apiRoutes.citation.path, async ({ request }) => {
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
          })
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
          })
        );
      }
    }
    return HttpResponse.json(rawCitationFixture());
  }),

  http.post(apiRoutes.wget.path, () => {
    return new HttpResponse(null, { status: 200 });
  }),

  http.get(apiRoutes.nodeStatus.path, () => {
    return HttpResponse.json(rawNodeStatusFixture());
  }),

  http.get(apiRoutes.introMarkdown.path, () => {
    return new HttpResponse('Some Markdown', {
      headers: { 'Content-Type': 'text/markdown' },
    });
  }),

  http.get(apiRoutes.esgfSearchSTAC.path, () => {
    return HttpResponse.json(stacSearchResultsFixture());
  }),

  http.post(apiRoutes.esgfSearchSTAC.path, () => {
    return HttpResponse.json(stacSearchResultsFixture().search);
  }),

  http.get(apiRoutes.esgfAggregationsSTAC.path, () => {
    return HttpResponse.json(stacAggregationsFixture());
  }),

  http.post(apiRoutes.esgfAggregationsSTAC.path, () => {
    return HttpResponse.json(stacAggregationsFixture());
  }),

  http.get('/projects/projects.json', () => {
    // Return a valid empty config (tests will use default projects)
    return HttpResponse.json({ additionalProjects: [], whitelist: [], blacklist: [], });
  }),

  // Default fallback handler
  http.get('*', () => {
    // console.error(`Please add request handler for ${req.url.toString()}`);
    return HttpResponse.json({ error: 'You must add request handler.' }, { status: 500 });
  }),
];

export default handlers;
