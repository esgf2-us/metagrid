/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { fireEvent, render } from '@testing-library/react';

import Cart, { Props } from './index';

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
  savedSearches: [],
  handleCart: jest.fn(),
  clearCart: jest.fn(),
};

it('renders component', () => {
  const { getByTestId } = render(
    <Router>
      <Cart {...defaultProps} />
    </Router>
  );
  expect(getByTestId('cart')).toBeTruthy();
});

test('renders alert message when datacart is empty', () => {
  const props = { ...defaultProps, cart: [] };
  const { getByText } = render(
    <Router>
      <Cart {...props} />
    </Router>
  );
  expect(getByText('Your cart is empty')).toBeTruthy();
});

it('calls the clearCart() function when confirming the popconfirm', () => {
  const { getByRole, getByText } = render(
    <Router>
      <Cart {...defaultProps} />
    </Router>
  );

  // Click the Remove All Items button
  const removeAllBtn = getByRole('button', { name: 'Remove All Items' });
  fireEvent.click(removeAllBtn);

  // Check popover appears
  const popOver = getByRole('tooltip');
  expect(popOver).toBeTruthy();

  // Submit the popover
  const submitPopOverBtn = getByText('OK');
  fireEvent.click(submitPopOverBtn);
});
