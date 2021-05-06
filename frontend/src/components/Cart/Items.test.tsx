import { fireEvent, render, waitFor, within } from '@testing-library/react';
import React from 'react';
import { userCartFixture } from '../../api/mock/fixtures';
import { rest, server } from '../../api/mock/setup-env';
import apiRoutes from '../../api/routes';
import { getRowName } from '../../test/custom-render';
import Items, { Props } from './Items';

const defaultProps: Props = {
  userCart: userCartFixture(),
  onUpdateCart: jest.fn(),
  onClearCart: jest.fn(),
};

it('renders message that the cart is empty when no items are added', () => {
  const props = { ...defaultProps, userCart: [] };
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
  // Mock window.location.href
  Object.defineProperty(window, 'location', {
    value: {
      href: jest.fn(),
    },
  });

  const { getByRole, getByTestId } = render(<Items {...defaultProps} />);

  // Check first row renders and click the checkbox
  const firstRow = getByRole('row', {
    name: getRowName('minus', 'question', 'foo', '3', '1', '1'),
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

  // Wait for cart items component to re-render
  await waitFor(() => getByTestId('cartItems'));
});

it('handles error selecting items in the cart and downloading them via wget', async () => {
  // Override route HTTP response
  server.use(
    rest.get(apiRoutes.wget.path, (_req, res, ctx) => res(ctx.status(404)))
  );

  const { getByRole, getByTestId, getByText } = render(
    <Items {...defaultProps} />
  );

  // Check first row renders and click the checkbox
  const firstRow = getByRole('row', {
    name: getRowName('minus', 'question', 'foo', '3', '1', '1'),
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
    getByText(apiRoutes.wget.handleErrorMsg(404))
  );
  expect(errorMsg).toBeTruthy();
});
