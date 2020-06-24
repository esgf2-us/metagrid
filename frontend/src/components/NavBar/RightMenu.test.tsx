/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { fireEvent, waitFor } from '@testing-library/react';
import RightMenu, { Props } from './RightMenu';
import { customRender } from '../../test/custom-render';

const rightMenuProps: Props = {
  mode: 'horizontal',
  numCartItems: 4,
  numSavedSearches: 1,
};

it('displays correct number of cartItems and numSavedSearches', () => {
  const { getByText } = customRender(
    <Router>
      <RightMenu {...rightMenuProps} />
    </Router>
  );
  expect(getByText('4')).toBeTruthy();
  expect(getByText('1')).toBeTruthy();
});

it('sets the active menu item based on the location pathname', async () => {
  const { getByRole } = customRender(
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
    getByRole('img', { name: 'search' })
  );
  expect(savedSearchLink).toBeTruthy();
  fireEvent.click(savedSearchLink);
});
it('display the user"s name after authentication and signs out', async () => {
  const { getByTestId, getByText } = customRender(
    <Router>
      <RightMenu {...rightMenuProps} />
    </Router>,
    {
      authenticated: true,
      idTokenParsed: { given_name: 'John', email: 'johndoe@url.com' },
    }
  );

  // Check applicable components render
  const rightMenuComponent = await waitFor(() => getByTestId('right-menu'));
  expect(rightMenuComponent).toBeTruthy();

  // Check user logged in and hover
  const greeting = await waitFor(() => getByText('Hi, John'));
  expect(greeting).toBeTruthy();
  fireEvent.mouseEnter(greeting);

  // Click the sign out button
  const signOutBtn = await waitFor(() => getByText('Sign Out'));
  expect(signOutBtn).toBeTruthy();
  fireEvent.click(signOutBtn);
});
it('display the user"s name after authentication and signs out', async () => {
  const { getByRole, getByTestId, getByText } = customRender(
    <Router>
      <RightMenu {...rightMenuProps} />
    </Router>
  );

  // Check applicable components render
  const rightMenuComponent = await waitFor(() => getByTestId('right-menu'));
  expect(rightMenuComponent).toBeTruthy();

  // Check no user logged in
  const greeting = await waitFor(() => getByText('Sign In'));
  expect(greeting).toBeTruthy();
  fireEvent.mouseEnter(greeting);

  // Click the sign out button
  const signInBtn = await waitFor(() =>
    getByRole('button', { name: 'Sign In' })
  );
  expect(signInBtn).toBeTruthy();
  fireEvent.click(signInBtn);
});
