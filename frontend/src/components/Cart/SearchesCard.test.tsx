import { fireEvent, render, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { userSearchQueryFixture } from '../../api/mock/fixtures';
import { rest, server } from '../../api/mock/setup-env';
import apiRoutes from '../../api/routes';
import SearchesCard, { Props } from './SearchesCard';

const defaultProps: Props = {
  searchQuery: userSearchQueryFixture(),
  index: 0,
  onRunSearchQuery: jest.fn(),
  onRemoveSearchQuery: jest.fn(),
};

beforeEach(() => {
  const mockHistoryPush = jest.fn();
  jest.mock(
    'react-router-dom',
    () =>
      ({
        ...jest.requireActual('react-router-dom'),
        useHistory: () => ({
          push: mockHistoryPush,
        }),
      } as Record<string, unknown>)
  );
});

it('renders component and handles button clicks', async () => {
  const { getByRole } = render(
    <MemoryRouter>
      <SearchesCard {...defaultProps} />
    </MemoryRouter>
  );

  // Check search button renders and click it
  const searchBtn = await waitFor(() => getByRole('img', { name: 'search' }));
  expect(searchBtn).toBeTruthy();
  fireEvent.click(searchBtn);

  // Check delete button renders and click it
  const deleteBtn = await waitFor(() => getByRole('img', { name: 'delete' }));
  expect(deleteBtn).toBeTruthy();
  fireEvent.click(deleteBtn);
});

it('displays alert error when api fails to return response', async () => {
  server.use(
    rest.get(apiRoutes.esgfSearch.path, (_req, res, ctx) =>
      res(ctx.status(404))
    )
  );

  const { getByRole } = render(<SearchesCard {...defaultProps} />);

  // Check alert renders
  const alert = await waitFor(() => getByRole('img', { name: 'close-circle' }));
  expect(alert).toBeTruthy();
});

it('displays "N/A" for Filename Searches when none are applied', () => {
  const { getByText } = render(
    <SearchesCard
      {...defaultProps}
      searchQuery={userSearchQueryFixture({ filenameVars: undefined })}
    />
  );
  // Shows number of files
  const filenameSearchesField = getByText('Filename Searches:').parentNode;
  expect(filenameSearchesField?.textContent).toEqual('Filename Searches: N/A');
});
