import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { userSearchQueryFixture } from '../../test/mock/fixtures';
import { rest, server } from '../../test/mock/server';
import apiRoutes from '../../api/routes';
import SearchesCard, { Props } from './SearchesCard';
import customRender from '../../test/custom-render';

const user = userEvent.setup();

const defaultProps: Props = {
  searchQuery: userSearchQueryFixture(),
  updateSearchQuery: jest.fn(),
  onHandleRemoveSearchQuery: jest.fn(),
  index: 0,
};

beforeEach(() => {
  const mockNavigate = jest.fn();
  jest.mock(
    'react-router',
    () =>
      ({
        ...jest.requireActual('react-router'),
        useNavigate: () => ({
          push: mockNavigate,
        }),
      } as Record<string, unknown>)
  );
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
  server.use(rest.get(apiRoutes.esgfSearch.path, (_req, res, ctx) => res(ctx.status(404))));

  customRender(
    <SearchesCard
      {...defaultProps}
      searchQuery={userSearchQueryFixture({ resultsCount: undefined })}
    />
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
    { usesAtoms: true }
  );
  // Shows number of files
  const filenameSearchesField = (await screen.findByText('Filename Searches:')).parentNode;
  expect(filenameSearchesField?.textContent).toEqual('Filename Searches: N/A');
});
