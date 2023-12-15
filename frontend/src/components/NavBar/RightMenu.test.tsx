/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { fireEvent, render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { customRenderKeycloak } from '../../test/custom-render';
import Support from '../Support';
import RightMenu, { Props } from './RightMenu';

const user = userEvent.setup();

const rightMenuProps: Props = {
  mode: 'horizontal',
  numCartItems: 4,
  numSavedSearches: 1,
  supportModalVisible: () => {
    render(<Support open onClose={jest.fn()} />);
  },
};

jest.mock('@react-keycloak/web', () => {
  const originalModule = jest.requireActual('@react-keycloak/web');

  return {
    ...originalModule,
    useKeycloak: () => {
      return {
        keycloak: {
          login: jest.fn(),
          logout: jest.fn(),
          idTokenParsed: { given_name: 'John' },
        },
      };
    },
  };
});

it('sets the active menu item based on the location pathname', async () => {
  const { getByRole } = customRenderKeycloak(<RightMenu {...rightMenuProps} />);

  const cartItemsLink = await waitFor(() =>
    getByRole('img', { name: 'shopping-cart' })
  );
  expect(cartItemsLink).toBeTruthy();
  await user.click(cartItemsLink);

  const savedSearchLink = await waitFor(() =>
    getByRole('img', { name: 'search' })
  );
  expect(savedSearchLink).toBeTruthy();
  await user.click(savedSearchLink);
});

xit('display the users given name after authentication and signs out', async () => {
  const { getByTestId, getByText } = customRenderKeycloak(
    <RightMenu {...rightMenuProps} />
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
  await user.click(signOutBtn);
});

xit('display the users email after authentication if they did not provide a name and signs out', async () => {
  const { getByTestId, getByText } = customRenderKeycloak(
    <RightMenu {...rightMenuProps} />,
    {}
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
  await user.click(signOutBtn);
});

xit('displays sign in button when user hasn"t logged in', async () => {
  const { getByRole, getByTestId } = customRenderKeycloak(
    <RightMenu {...rightMenuProps} />
  );

  // Check applicable components render
  const rightMenuComponent = await waitFor(() => getByTestId('right-menu'));
  expect(rightMenuComponent).toBeTruthy();

  // Click the sign in button
  const signInBtn = await waitFor(() => getByRole('img', { name: 'user' }));
  expect(signInBtn).toBeTruthy();
  await user.click(signInBtn);
});

it('displays help menu when help button is clicked', async () => {
  const { getByText, getByTestId } = customRenderKeycloak(
    <RightMenu {...rightMenuProps} />
  );

  // Check applicable components render
  const rightMenuComponent = await waitFor(() => getByTestId('right-menu'));
  expect(rightMenuComponent).toBeTruthy();

  // Click the help button
  const helpBtn = await waitFor(() => getByText('Help'));
  expect(helpBtn).toBeTruthy();
  await user.click(helpBtn);

  // Check support form rendered
  const support = getByTestId('support-form');
  expect(support).toBeTruthy();
});

it('the the right drawer display for news button and hide news button', async () => {
  const { getByText, getByTestId } = customRenderKeycloak(
    <RightMenu {...rightMenuProps} />
  );

  // Check applicable components render
  const rightMenuComponent = await waitFor(() => getByTestId('right-menu'));
  expect(rightMenuComponent).toBeTruthy();

  // Click the news button
  const newsBtn = await waitFor(() => getByText('News'));
  expect(newsBtn).toBeTruthy();
  await user.click(newsBtn);

  // Click hide button
  const hideBtn = await waitFor(() => getByText('Hide'));
  expect(hideBtn).toBeTruthy();
  await user.click(hideBtn);
});
