import { fireEvent, render, waitFor } from '@testing-library/react';
import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { customRender } from '../../test/custom-render';
import Support from '../Support';
import RightMenu, { Props } from './RightMenu';

const rightMenuProps: Props = {
  mode: 'horizontal',
  numCartItems: 4,
  numSavedSearches: 1,
  supportModalVisible: () => {
    render(<Support visible onClose={jest.fn()} />);
  },
};

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

it('display the user"s given name after authentication and signs out', async () => {
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

it('display the user"s email after authentication if they did not provide a name and signs out', async () => {
  const { getByTestId, getByText } = customRender(
    <Router>
      <RightMenu {...rightMenuProps} />
    </Router>,
    {
      authenticated: true,
      idTokenParsed: { email: 'johndoe@url.com' },
    }
  );

  // Check applicable components render
  const rightMenuComponent = await waitFor(() => getByTestId('right-menu'));
  expect(rightMenuComponent).toBeTruthy();

  // Check user logged in and hover
  const greeting = await waitFor(() => getByText('Hi, johndoe@url.com'));
  expect(greeting).toBeTruthy();
  fireEvent.mouseEnter(greeting);

  // Click the sign out button
  const signOutBtn = await waitFor(() => getByText('Sign Out'));
  expect(signOutBtn).toBeTruthy();
  fireEvent.click(signOutBtn);
});

it('displays sign in button when user hasn"t logged in', async () => {
  const { getByRole, getByTestId } = customRender(
    <Router>
      <RightMenu {...rightMenuProps} />
    </Router>
  );

  // Check applicable components render
  const rightMenuComponent = await waitFor(() => getByTestId('right-menu'));
  expect(rightMenuComponent).toBeTruthy();

  // Click the sign ib button
  const signInBtn = await waitFor(() => getByRole('img', { name: 'user' }));
  expect(signInBtn).toBeTruthy();
  fireEvent.click(signInBtn);
});

it('displays help menu when help button is clicked', async () => {
  const { getByText, getByTestId } = customRender(
    <Router>
      <RightMenu {...rightMenuProps} />
    </Router>
  );

  // Check applicable components render
  const rightMenuComponent = await waitFor(() => getByTestId('right-menu'));
  expect(rightMenuComponent).toBeTruthy();

  // Click the help button
  const helpBtn = await waitFor(() => getByText('Help'));
  expect(helpBtn).toBeTruthy();
  fireEvent.click(helpBtn);

  // Check support form rendered
  const support = getByTestId('support-form');
  expect(support).toBeTruthy();
});
