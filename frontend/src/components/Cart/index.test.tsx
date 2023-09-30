import { waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import {
  userCartFixture,
  userSearchQueriesFixture,
} from '../../api/mock/fixtures';
import Cart, { Props } from './index';
import { customRender } from '../../test/custom-render';
// import { rest, server } from '../../api/mock/setup-env';
// import { saveSessionValue } from '../../api';
// import apiRoutes from '../../api/routes';

const defaultProps: Props = {
  userCart: userCartFixture(),
  userSearchQueries: userSearchQueriesFixture(),
  onUpdateCart: jest.fn(),
  onClearCart: jest.fn(),
  onRunSearchQuery: jest.fn(),
  onRemoveSearchQuery: jest.fn(),
};

const user = userEvent.setup();

let mockNavigate: () => void;
beforeEach(() => {
  mockNavigate = jest.fn();
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

afterEach(() => {
  jest.clearAllMocks();
});

it('handles tab switching and saved search actions', async () => {
  const { getByRole, getByTestId } = customRender(<Cart {...defaultProps} />);

  // Check cart tab renders
  const cart = await waitFor(() => getByTestId('cart'));
  expect(cart).toBeTruthy();

  // Check Search Library Tab renders and click it
  const searchLibraryTab = await waitFor(() =>
    getByRole('tab', {
      name: 'book Search Library',
      hidden: true,
    })
  );
  expect(searchLibraryTab).toBeTruthy();
  await user.click(searchLibraryTab);

  // Check JSON link renders and click it
  const jsonLink = await waitFor(() => getByRole('link'));
  expect(jsonLink).toBeTruthy();
  await user.click(jsonLink);

  // Wait for cart to re-render
  await waitFor(() => getByTestId('cart'));
  // Check apply search button renders and click it
  const applyBtn = await waitFor(() =>
    getByRole('img', { name: 'search', hidden: true })
  );
  expect(applyBtn).toBeTruthy();
  await user.click(applyBtn);

  // Wait for cart to re-render
  await waitFor(() => getByTestId('cart'));

  // Check delete button renders and click it
  const deleteBtn = await waitFor(() =>
    getByRole('img', { name: 'delete', hidden: true })
  );
  expect(deleteBtn).toBeTruthy();
  await user.click(deleteBtn);

  // Save value test
  /* server.use(
    rest.post(apiRoutes.tempStorageGet.path, (_req, res, ctx) =>
      res(ctx.status(200), ctx.json({ data: 'Save success!' }))
    )
  );
  const saveResp = await saveSessionValue('dataVal', 'None');
  expect(saveResp.data).toEqual('Save success!');*/
});
