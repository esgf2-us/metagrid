import { act, screen } from '@testing-library/react';
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
  index: 0,
  onRunSearchQuery: jest.fn(),
  onRemoveSearchQuery: jest.fn(),
};

beforeEach(() => {
  const mockNavigate = jest.fn();
  jest.mock(
    'react-router-dom',
    () =>
      ({
        ...jest.requireActual('react-router-dom'),
        useNavigate: () => ({
          push: mockNavigate,
        }),
      } as Record<string, unknown>)
  );
});

it('renders component and handles button clicks', async () => {
  customRender(<SearchesCard {...defaultProps} />);

  // Check search button renders and click it
  const searchBtn = await screen.findByRole('img', { name: 'search' });
  expect(searchBtn).toBeTruthy();

  await act(async () => {
    await user.click(searchBtn);
  });

  // Check delete button renders and click it
  const deleteBtn = await screen.findByRole('img', { name: 'delete' });
  expect(deleteBtn).toBeTruthy();

  await act(async () => {
    await user.click(deleteBtn);
  });
});

it('displays alert error when api fails to return response', async () => {
  server.use(
    rest.get(apiRoutes.esgfSearch.path, (_req, res, ctx) =>
      res(ctx.status(404))
    )
  );

  customRender(<SearchesCard {...defaultProps} />);

  // Check alert renders
  const alert = await screen.findByRole('alert');
  expect(alert).toBeTruthy();
});

it('displays "N/A" for Filename Searches when none are applied', () => {
  const { getByText } = customRender(
    <SearchesCard
      {...defaultProps}
      searchQuery={userSearchQueryFixture({ filenameVars: undefined })}
    />
  );
  // Shows number of files
  const filenameSearchesField = getByText('Filename Searches:').parentNode;
  expect(filenameSearchesField?.textContent).toEqual('Filename Searches: N/A');
});
