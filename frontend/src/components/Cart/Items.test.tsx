/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { fireEvent, render, within, waitFor } from '@testing-library/react';

import Items, { Props } from './Items';
import apiRoutes from '../../api/routes';
import { cartFixture } from '../../api/mock/fixtures';
import { rest, server } from '../../api/mock/setup-env';

const defaultProps: Props = {
  cart: cartFixture(),
  handleCart: jest.fn(),
  clearCart: jest.fn(),
};

it('renders message that the cart is empty when no items are added', () => {
  const props = { ...defaultProps, cart: [] };
  const { getByText } = render(<Items {...props} />);

  // Check empty cart text renders
  const emptyCart = getByText('Your cart is empty');
  expect(emptyCart).toBeTruthy();
});

it('removes all items from the cart when confirming the popconfirm', () => {
  const { getByRole, getByText } = render(<Items {...defaultProps} />);

  // Click the Remove All Items button
  const removeAllBtn = getByRole('button', { name: 'Remove All Items' });
  expect(removeAllBtn).toBeTruthy();
  fireEvent.click(removeAllBtn);

  // Check popover appears
  const popOver = getByRole('tooltip');
  expect(popOver).toBeInTheDocument();

  // Submit the popover
  const submitPopOverBtn = getByText('OK');
  fireEvent.click(submitPopOverBtn);
});

it('handles selecting items in the cart and downloading them via wget', async () => {
  const { getByRole, getByTestId } = render(<Items {...defaultProps} />);

  // Check first row renders and click the checkbox
  const firstRow = getByRole('row', {
    name:
      'right-circle foo 3 1 Bytes node.gov 1 check-circle Globus Compatible wget download minus',
  });
  const firstCheckBox = within(firstRow).getByRole('checkbox');
  expect(firstCheckBox).toBeTruthy();
  fireEvent.click(firstCheckBox);

  // Check download form renders
  const downloadForm = getByTestId('downloadForm');
  expect(downloadForm).toBeTruthy();

  // Check download button exists and submit the form
  const downloadBtn = within(downloadForm).getByRole('img', {
    name: 'download',
  });
  expect(downloadBtn).toBeTruthy();
  fireEvent.submit(downloadBtn);

  // Check cart items component renders
  const cartItemsComponent = await waitFor(() => getByTestId('cartItems'));
  expect(cartItemsComponent).toBeTruthy();
});

it('handles error selecting items in the cart and downloading them via wget', async () => {
  // Override route HTTP response
  server.use(
    rest.get(apiRoutes.wget, (_req, res, ctx) => {
      return res(ctx.status(404));
    })
  );

  const { getByRole, getByTestId, getByText } = render(
    <Items {...defaultProps} />
  );

  // Check first row renders and click the checkbox
  const firstRow = getByRole('row', {
    name:
      'right-circle foo 3 1 Bytes node.gov 1 check-circle Globus Compatible wget download minus',
  });
  const firstCheckBox = within(firstRow).getByRole('checkbox');
  expect(firstCheckBox).toBeTruthy();
  fireEvent.click(firstCheckBox);

  // Check download form renders
  const downloadForm = getByTestId('downloadForm');
  expect(downloadForm).toBeTruthy();

  // Check download button exists and submit the form
  const downloadBtn = within(downloadForm).getByRole('img', {
    name: 'download',
  });
  expect(downloadBtn).toBeTruthy();
  fireEvent.submit(downloadBtn);

  // Check cart items component renders
  const cartItemsComponent = await waitFor(() => getByTestId('cartItems'));
  expect(cartItemsComponent).toBeTruthy();

  // Check error message renders
  const errorMsg = await waitFor(() =>
    getByText(
      'There was an issue fetching the wget script. Please contact support or try again later.'
    )
  );
  expect(errorMsg).toBeTruthy();
});
