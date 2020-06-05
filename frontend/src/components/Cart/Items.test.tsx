/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { fireEvent, render } from '@testing-library/react';

import Items, { Props } from './Items';

const defaultProps: Props = {
  cart: [
    {
      id: 'foo',
      url: ['foo.bar'],
      number_of_files: 3,
      data_node: 'node.gov',
      version: 1,
      access: ['HTTPServer', 'GridFTP', 'OPENDAP', 'Globus'],
    },
    {
      id: 'bar',
      url: ['foo.bar'],
      number_of_files: 2,
      data_node: 'node.gov',
      version: 1,
      access: ['HTTPServer', 'GridFTP', 'OPENDAP', 'Globus'],
    },
  ],
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
