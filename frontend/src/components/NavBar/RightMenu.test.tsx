/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import customRender from '../../test/custom-render';
import { matchMedia, setMedia } from 'mock-match-media';
import RightMenu, { Props } from './RightMenu';
import {
  mockConfig,
  mockKeycloakToken,
  AtomWrapper,
  printElementContents,
} from '../../test/jestTestFunctions';
import { tempStorageSetMock } from '../../test/mock/mockStorage';
import { activeSearchQueryFixture } from '../../test/mock/fixtures';
import App from '../App/App';
import { AppStateKeys } from '../../common/atoms';

const user = userEvent.setup();

const rightMenuProps: Props = {
  mode: 'horizontal',
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

it('Renders the node status link if node status url is configured', async () => {
  window.METAGRID.STATUS_URL = 'https://example.com/status';
  customRender(<RightMenu {...rightMenuProps} />);

  const nodeStatusLink = await screen.findByText('Node Status', { exact: false });
  expect(nodeStatusLink).toBeTruthy();
});

it('Does not render the node status link if node status url is not configured', async () => {
  window.METAGRID.STATUS_URL = null;
  customRender(<RightMenu {...rightMenuProps} />);

  const nodeStatusLink = screen.queryByText('Node Status', { exact: false });
  expect(nodeStatusLink).not.toBeInTheDocument();
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

  customRender(<RightMenu {...rightMenuProps} />);

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
  customRender(<App searchQuery={activeSearchQueryFixture()} />);

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

it('toggles theme switch between light and dark modes', async () => {
  customRender(<RightMenu {...rightMenuProps} />);

  const themeSwitch = await screen.findByTestId('isDarkModeSwitch');
  expect(themeSwitch).toBeTruthy();

  // Initial state should be light mode
  expect(themeSwitch).toBeChecked();

  // Toggle to dark mode
  await user.click(themeSwitch);
  expect(themeSwitch).not.toBeChecked();

  // Toggle back to light mode
  await user.click(themeSwitch);
  expect(themeSwitch).toBeChecked();
});

it('displays correct cart and saved searches badge counts', async () => {
  customRender(<RightMenu {...rightMenuProps} />);

  const cartBadge = await screen.findByText('3');
  expect(cartBadge).toBeTruthy();

  const savedSearchesBadge = await screen.findByText('1');
  expect(savedSearchesBadge).toBeTruthy();
});

describe('Dark Mode', () => {
  it('gives precedence to stored preference over prefers-color-scheme', () => {
    // Set the initial preference to dark mode
    setMedia({ 'prefers-color-scheme': 'dark' });
    expect(matchMedia('(prefers-color-scheme: dark)').matches).toBe(true);

    AtomWrapper.modifyAtomValue(AppStateKeys.isDarkMode, false);
    customRender(<RightMenu mode="vertical"></RightMenu>, { usesAtoms: true });
    waitFor(() => {
      expect(screen.getByTestId('isDarkModeSwitch')).toBeChecked();
    });
  });

  it('stores preference when selected', async () => {
    AtomWrapper.modifyAtomValue(AppStateKeys.isDarkMode, true);
    customRender(<RightMenu mode="vertical"></RightMenu>, { usesAtoms: true });

    const isDarkModeSwitch = await screen.findByTestId('isDarkModeSwitch');
    expect(isDarkModeSwitch).not.toBeChecked();
    expect(localStorage.getItem(AppStateKeys.isDarkMode)).toBe('true');

    await user.click(isDarkModeSwitch);
    expect(isDarkModeSwitch).toBeChecked();
    expect(localStorage.getItem(AppStateKeys.isDarkMode)).toBe('false');
  });

  it('respects (prefers-color-scheme: dark) when no user preference is set', async () => {
    setMedia({ 'prefers-color-scheme': 'dark' });
    expect(matchMedia('(prefers-color-scheme: dark)').matches).toBe(true);

    AtomWrapper.modifyAtomValue(AppStateKeys.isDarkMode, undefined);
    customRender(<RightMenu {...rightMenuProps} />, { usesAtoms: true });

    waitFor(() => {
      expect(screen.findByTestId('isDarkModeSwitch')).toBeChecked(); // Dark mode should be enabled
    });
  });

  it('respects (prefers-color-scheme: light) when no user preference is set', async () => {
    setMedia({ 'prefers-color-scheme': 'light' });
    expect(matchMedia('(prefers-color-scheme: light)').matches).toBe(true);

    AtomWrapper.modifyAtomValue(AppStateKeys.isDarkMode, undefined);
    customRender(<RightMenu {...rightMenuProps} />, { usesAtoms: true });

    waitFor(() => {
      expect(screen.findByTestId('isDarkModeSwitch')).toBeChecked(); // Dark mode should be enabled
    });
  });
});
