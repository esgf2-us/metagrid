/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { fireEvent, render, waitFor } from '@testing-library/react';

import Cart, { Props } from './index';
import { cartFixture, savedSearchesFixture } from '../../test/fixtures';

const defaultProps: Props = {
  cart: cartFixture(),
  savedSearches: savedSearchesFixture(),
  handleCart: jest.fn(),
  clearCart: jest.fn(),
  handleRemoveSearch: jest.fn(),
  handleApplySearch: jest.fn(),
};

let mockHistoryPush: () => void;
beforeEach(() => {
  mockHistoryPush = jest.fn();
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

afterEach(() => {
  jest.clearAllMocks();
});

it('handles tab switching and saved search actions', async () => {
  const { getByRole, getByTestId } = render(
    <MemoryRouter>
      <Cart {...defaultProps} />
    </MemoryRouter>
  );

  // Check cart tab renders
  const cart = await waitFor(() => getByTestId('cart'));
  expect(cart).toBeTruthy();

  // Check Search Criteria Tab renders and click it
  const searchCriteriaTab = await waitFor(() =>
    getByRole('tab', {
      name: 'book Search Criteria',
      hidden: true,
    })
  );
  expect(searchCriteriaTab).toBeTruthy();
  fireEvent.click(searchCriteriaTab);

  // Check JSON link renders and click it
  const jsonLink = await waitFor(() => getByRole('link'));
  expect(jsonLink).toBeTruthy();
  fireEvent.click(jsonLink);

  // Wait for cart to re-render
  await waitFor(() => getByTestId('cart'));
  // Check apply search button renders and click it
  const applyBtn = await waitFor(() =>
    getByRole('img', { name: 'search', hidden: true })
  );
  expect(applyBtn).toBeTruthy();
  fireEvent.click(applyBtn);

  // Wait for cart to re-render
  await waitFor(() => getByTestId('cart'));

  // Check delete button renders and click it
  const deleteBtn = await waitFor(() =>
    getByRole('img', { name: 'delete', hidden: true })
  );
  expect(deleteBtn).toBeTruthy();
  fireEvent.click(deleteBtn);
});
