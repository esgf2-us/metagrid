/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { fireEvent, render, waitFor } from '@testing-library/react';

import SearchesCard, { Props } from './SearchesCard';
import { savedSearchFixture } from '../../test/fixtures';
import { apiRoutes } from '../../test/server-handlers';
import { server, rest } from '../../test/setup-env';

const defaultProps: Props = {
  savedSearch: savedSearchFixture(),
  index: 0,
  handleRemoveSearch: jest.fn(),
  handleApplySearch: jest.fn(),
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
    rest.get(apiRoutes.esgSearchDatasets, (_req, res, ctx) => {
      return res(ctx.status(404));
    })
  );

  const { getByRole } = render(<SearchesCard {...defaultProps} />);

  // Check alert renders
  const alert = await waitFor(() => getByRole('img', { name: 'close-circle' }));
  expect(alert).toBeTruthy();
});
