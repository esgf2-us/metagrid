/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { fireEvent, render, waitFor } from '@testing-library/react';
import RightMenu, { Props } from './RightMenu';

const rightMenuProps: Props = {
  mode: 'horizontal',
  numCartItems: 4,
  numSavedSearches: 1,
};

test('RightMenu displays correct number of cartItems and numSavedSearches', () => {
  const { getByText } = render(
    <Router>
      <RightMenu {...rightMenuProps} />
    </Router>
  );
  expect(getByText('4')).toBeTruthy();
  expect(getByText('1')).toBeTruthy();
});

it('sets the active menu item based on the location pathname', async () => {
  const { getByRole } = render(
    <Router>
      <RightMenu {...rightMenuProps} />
    </Router>
  );

  const cartItemsLink = await waitFor(() =>
    getByRole('img', { name: 'shopping-cart' })
  );
  expect(cartItemsLink).toBeTruthy();
  fireEvent.click(cartItemsLink);

  const savedSearchLink = await waitFor(() =>
    getByRole('img', { name: 'book' })
  );
  expect(savedSearchLink).toBeTruthy();
  fireEvent.click(savedSearchLink);
});
