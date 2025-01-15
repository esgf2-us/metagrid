/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import customRender from '../../test/custom-render';
import Support from '../Support';
import RightMenu, { Props } from './RightMenu';
import { mockConfig, mockKeycloakToken, tempStorageSetMock } from '../../test/jestTestFunctions';

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
      return mockKeycloakToken();
    },
  };
});

it('sets the active menu item based on the location pathname', async () => {
  customRender(<RightMenu {...rightMenuProps} />);

  const cartItemsLink = await screen.findByRole('img', {
    name: 'shopping-cart',
  });
  expect(cartItemsLink).toBeTruthy();

  await user.click(cartItemsLink);

  const savedSearchLink = await screen.findByRole('img', { name: 'search' });
  expect(savedSearchLink).toBeTruthy();

  await user.click(savedSearchLink);
});

it('display the users given name after authentication with keycloak', async () => {
  mockConfig.AUTHENTICATION_METHOD = 'keycloak';

  tempStorageSetMock('keycloakFixture', {
    keycloak: {
      login: jest.fn(),
      logout: jest.fn(),
      idTokenParsed: { given_name: 'John Doe', email: 'johnd@email.gov' },
    },
  });

  customRender(<RightMenu {...rightMenuProps} />);

  // Check applicable components render
  const rightMenuComponent = await screen.findByTestId('right-menu');
  expect(rightMenuComponent).toBeTruthy();

  // Check user logged in and hover
  const greeting = await screen.findByText('Hi, John Doe', { exact: false });
  expect(greeting).toBeTruthy();
});

it('display the users email after authentication if they did not provide a name in keycloak', async () => {
  mockConfig.AUTHENTICATION_METHOD = 'keycloak';

  tempStorageSetMock('keycloakFixture', {
    keycloak: {
      login: jest.fn(),
      logout: jest.fn(),
      idTokenParsed: { email: 'johnd@email.gov' },
    },
  });

  customRender(<RightMenu {...rightMenuProps} />, {});

  // Check applicable components render
  const rightMenuComponent = await screen.findByTestId('right-menu');
  expect(rightMenuComponent).toBeTruthy();

  // Check user logged in and hover
  const greeting = await screen.findByText('Hi, johnd@email.gov');
  expect(greeting).toBeTruthy();
});

it("displays sign in button when user hasn't logged in via keycloak", async () => {
  mockConfig.AUTHENTICATION_METHOD = 'keycloak';

  customRender(<RightMenu {...rightMenuProps} />);

  // Check applicable components render
  const rightMenuComponent = await screen.findByTestId('right-menu');
  expect(rightMenuComponent).toBeTruthy();

  // Click the sign in button
  const signInBtn = await screen.findByRole('img', { name: 'user' });
  expect(signInBtn).toBeTruthy();

  await user.click(signInBtn);
});

it("displays sign in button when user hasn't logged in via globus", async () => {
  mockConfig.AUTHENTICATION_METHOD = 'globus';

  customRender(<RightMenu {...rightMenuProps} />);

  // Check applicable components render
  const rightMenuComponent = await screen.findByTestId('right-menu');
  expect(rightMenuComponent).toBeTruthy();

  // Click the sign in button
  const signInBtn = await screen.findByRole('img', { name: 'user' });
  expect(signInBtn).toBeTruthy();

  await user.click(signInBtn);
});

it('displays help menu when help button is clicked', async () => {
  customRender(<RightMenu {...rightMenuProps} />);

  // Check applicable components render
  const rightMenuComponent = await screen.findByTestId('right-menu');
  expect(rightMenuComponent).toBeTruthy();

  // Click the help button
  const helpBtn = await screen.findByText('Help');
  expect(helpBtn).toBeTruthy();

  await user.click(helpBtn);

  // Check support form rendered
  const support = await screen.findByTestId('support-form');
  expect(support).toBeTruthy();
});

it('the the right drawer display for news button and hide news button', async () => {
  customRender(<RightMenu {...rightMenuProps} />);

  // Check applicable components render
  const rightMenuComponent = await screen.findByTestId('right-menu');
  expect(rightMenuComponent).toBeTruthy();

  // Click the news button
  const newsBtn = await screen.findByText('News');
  expect(newsBtn).toBeTruthy();

  await user.click(newsBtn);

  // Click hide button
  const hideBtn = await screen.findByText('Hide');
  expect(hideBtn).toBeTruthy();

  await user.click(hideBtn);
});
