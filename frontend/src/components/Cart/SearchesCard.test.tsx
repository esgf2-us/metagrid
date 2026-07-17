import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { vi } from 'vitest';
import {
  userSearchQueryFixture,
  stacSearchResultsFixture,
  stacAggregationsFixture,
} from '../../test/mock/fixtures';
import { http, server } from '../../test/mock/server';
import { HttpResponse } from 'msw';
import apiRoutes from '../../api/routes';
import SearchesCard, { Props } from './SearchesCard';
import customRender from '../../test/custom-render';

// hoist navigate mock for vi.mock (vitest hoists mocks)
const mockNavigate = vi.fn();

vi.mock(
  'react-router',
  async () =>
    ({
      ...(await vi.importActual('react-router')),
      useNavigate: () => mockNavigate,
    }) as Record<string, unknown>,
);

const user = userEvent.setup();

const defaultProps: Props = {
  searchQuery: userSearchQueryFixture(),
  updateSearchQuery: vi.fn(),
  onHandleRemoveSearchQuery: vi.fn(),
  index: 0,
};

beforeEach(() => {
  mockNavigate.mockClear();
});

it('renders components', async () => {
  customRender(<SearchesCard {...defaultProps} />);

  // Check search button renders
  const searchBtn = await screen.findByRole('img', { name: 'search' });
  expect(searchBtn).toBeTruthy();

  // Shows number of files
  const filenameSearchesField = (await screen.findByText('Filename Searches:')).parentNode;
  expect(filenameSearchesField?.textContent).toEqual('Filename Searches: var');

  // Check delete button renders and click it
  const deleteBtn = await screen.findByRole('img', { name: 'delete' });
  expect(deleteBtn).toBeTruthy();

  await user.click(deleteBtn);
});

it('displays alert error when api fails to return response', async () => {
  server.use(
    http.get(apiRoutes.esgfSearch.path, () => {
      return new HttpResponse(null, { status: 404 });
    })
  );

  customRender(
    <SearchesCard
      {...defaultProps}
      searchQuery={userSearchQueryFixture({ resultsCount: undefined })}
    />,
  );

  // Check alert renders
  const alert = await screen.findByRole('alert');
  expect(alert).toBeTruthy();
});

it('displays "N/A" for Filename Searches when none are applied', async () => {
  customRender(
    <SearchesCard
      {...defaultProps}
      searchQuery={userSearchQueryFixture({ filenameVars: undefined })}
    />,
    { usesAtoms: true },
  );
  // Shows number of files
  const filenameSearchesField = (await screen.findByText('Filename Searches:')).parentNode;
  expect(filenameSearchesField?.textContent).toEqual('Filename Searches: N/A');
});

it('updates searchQuery with STAC numMatched when project is STAC', async () => {
  // Mock STAC aggregations and STAC search responses
  server.use(
    http.post(apiRoutes.esgfAggregationsSTAC.path, () => {
      return HttpResponse.json(stacAggregationsFixture());
    })
    http.post(apiRoutes.esgfSearchSTAC.path, () => {
      return HttpResponse.json(stacSearchResultsFixture().search);
    })
  );

  const mockUpdate = vi.fn();
  const mockRemove = vi.fn();

  // Create a search query that indicates a STAC project and forces re-fetch
  const baseQuery = userSearchQueryFixture();
  const stacProject = { ...baseQuery.project, isSTAC: true, projectName: 'CMIP6' };
  const stacQuery = {
    ...baseQuery,
    project: stacProject,
    resultsCount: 2,
    searchTime: null,
    search: { numMatched: 2 },
  };

  customRender(
    <SearchesCard
      searchQuery={stacQuery}
      updateSearchQuery={mockUpdate}
      onHandleRemoveSearchQuery={mockRemove}
      index={0}
    />,
  );

  // Wait for the component to fetch and call updateSearchQuery
  await waitFor(() => expect(mockUpdate).toHaveBeenCalled());

  // Verify updateSearchQuery was called with resultsCount equal to numMatched
  const calledArg = mockUpdate.mock.calls[0][0];
  expect(calledArg.resultsCount).toBe(stacSearchResultsFixture().search.numMatched);
});
