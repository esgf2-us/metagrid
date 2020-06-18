import { rest } from 'msw';
import {
  projectsFixture,
  citationFixture,
  esgSearchApiFixture,
} from './fixtures';
import { apiBaseUrl, nodeRoute, nodeUrl, proxyString } from '../env';

type ApiRoutes = {
  metagrid: string;
  esgSearchDatasets: string;
  esgSearchFiles: string;
  citation: string;
};

// Routes for API services utilized by the app.
export const apiRoutes: ApiRoutes = {
  // MetaGrid API - projects
  metagrid: `${apiBaseUrl}/api/v1/projects/`,
  // ESGF Search API - datasets
  esgSearchDatasets: `${proxyString}/${nodeRoute}/esg-search/search/`,
  // ESGF Search API - files
  esgSearchFiles: `${proxyString}/${nodeRoute}/search_files/:id/${nodeUrl}/`,
  // ESGF Citation API (uses dummy link)
  citation: `${proxyString}/citation_url`,
};

// Handlers for each route, which returns a corresponding fixture.
// These handlers can be overridden in a test, for example when a 404 needs to
// be returned to //display an error message within a component.
const handlers = [
  rest.get(apiRoutes.metagrid, (_req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ results: projectsFixture() }));
  }),
  rest.get(apiRoutes.esgSearchDatasets, (_req, res, ctx) => {
    return res(ctx.status(200), ctx.json(esgSearchApiFixture()));
  }),
  rest.get(apiRoutes.esgSearchFiles, (_req, res, ctx) => {
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
