/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { act, render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import customRender from '../../test/custom-render';
import Support from '../Support';
import RightMenu, { Props } from './RightMenu';
import {
  mockConfig,
  mockKeycloakToken,
  printElementContents,
  tempStorageSetMock,
} from '../../test/jestTestFunctions';

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
  const { getByRole } = customRender(<RightMenu {...rightMenuProps} />);

  const cartItemsLink = await waitFor(() =>
    getByRole('img', { name: 'shopping-cart' })
  );
  expect(cartItemsLink).toBeTruthy();

  await act(async () => {
    await user.click(cartItemsLink);
  });

  const savedSearchLink = await waitFor(() =>
    getByRole('img', { name: 'search' })
  );
  expect(savedSearchLink).toBeTruthy();

  await act(async () => {
    await user.click(savedSearchLink);
  });
});

it('display the users given name after authentication with keycloak', async () => {
  mockConfig.authenticationMethod = 'keycloak';

  tempStorageSetMock('keycloakFixture', {
    keycloak: {
      login: jest.fn(),
      logout: jest.fn(),
      idTokenParsed: { given_name: 'John Doe', email: 'johnd@email.gov' },
    },
  });

  const { getByTestId, getByText } = customRender(
    <RightMenu {...rightMenuProps} />
  );

  // Check applicable components render
  const rightMenuComponent = await waitFor(() => getByTestId('right-menu'));
  expect(rightMenuComponent).toBeTruthy();

  // Check user logged in and hover
  const greeting = await waitFor(() =>
    getByText('Hi, John Doe', { exact: false })
  );
  expect(greeting).toBeTruthy();
});

it('display the users email after authentication if they did not provide a name in keycloak', async () => {
  mockConfig.authenticationMethod = 'keycloak';

  tempStorageSetMock('keycloakFixture', {
    keycloak: {
      login: jest.fn(),
      logout: jest.fn(),
      idTokenParsed: { email: 'johnd@email.gov' },
    },
  });

  const { findByTestId, findByText } = customRender(
    <RightMenu {...rightMenuProps} />,
    {}
  );

  // Check applicable components render
  const rightMenuComponent = await findByTestId('right-menu');
  expect(rightMenuComponent).toBeTruthy();

  printElementContents(undefined);

  // Check user logged in and hover
  const greeting = await findByText('Hi, johnd@email.gov');
  expect(greeting).toBeTruthy();
});

it('displays sign in button when user hasn"t logged in', async () => {
  const { getByRole, getByTestId } = customRender(
    <RightMenu {...rightMenuProps} />
  );

  // Check applicable components render
  const rightMenuComponent = await waitFor(() => getByTestId('right-menu'));
  expect(rightMenuComponent).toBeTruthy();

  // Click the sign in button
  const signInBtn = await waitFor(() => getByRole('img', { name: 'user' }));
  expect(signInBtn).toBeTruthy();

  await act(async () => {
    await user.click(signInBtn);
  });
});

it('displays help menu when help button is clicked', async () => {
  const { getByText, getByTestId } = customRender(
    <RightMenu {...rightMenuProps} />
  );

  // Check applicable components render
  const rightMenuComponent = await waitFor(() => getByTestId('right-menu'));
  expect(rightMenuComponent).toBeTruthy();

  // Click the help button
  const helpBtn = await waitFor(() => getByText('Help'));
  expect(helpBtn).toBeTruthy();

  await act(async () => {
    await user.click(helpBtn);
  });

  // Check support form rendered
  const support = getByTestId('support-form');
  expect(support).toBeTruthy();
});

it('the the right drawer display for news button and hide news button', async () => {
  const { getByText, getByTestId } = customRender(
    <RightMenu {...rightMenuProps} />
  );

  // Check applicable components render
  const rightMenuComponent = await waitFor(() => getByTestId('right-menu'));
  expect(rightMenuComponent).toBeTruthy();

  // Click the news button
  const newsBtn = await waitFor(() => getByText('News'));
  expect(newsBtn).toBeTruthy();

  await act(async () => {
    await user.click(newsBtn);
  });

  // Click hide button
  const hideBtn = await waitFor(() => getByText('Hide'));
  expect(hideBtn).toBeTruthy();

  await act(async () => {
    await user.click(hideBtn);
  });
});
