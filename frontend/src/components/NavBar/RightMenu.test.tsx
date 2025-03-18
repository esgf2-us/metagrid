/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { RecoilRoot } from 'recoil';
import { setMedia } from 'mock-match-media';
import customRender from '../../test/custom-render';
import RightMenu, { Props } from './RightMenu';
import { mockConfig, mockKeycloakToken } from '../../test/jestTestFunctions';
import { tempStorageSetMock } from '../../test/mock/mockStorage';
import { isDarkModeAtom } from '../App/recoil/atoms';
import { activeSearchQueryFixture } from '../../test/mock/fixtures';
import App from '../App/App';

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
  customRender(<RightMenu {...rightMenuProps} />, { usesRecoil: true });

  const cartBadge = await screen.findByText('3');
  expect(cartBadge).toBeTruthy();

  const savedSearchesBadge = await screen.findByText('1');
  expect(savedSearchesBadge).toBeTruthy();
});

describe('Dark Mode', () => {
  it('respects (prefers-color-scheme: dark) when preference unset', () => {
    setMedia({
      'prefers-color-scheme': 'dark',
    });
    localStorage.clear();
    customRender(<RightMenu mode="vertical"></RightMenu>);
    expect(screen.getByTestId('isDarkModeSwitch')).not.toBeChecked();
  });

  it('respects (prefers-color-scheme: light) when preference unset', () => {
    setMedia({
      'prefers-color-scheme': 'light',
    });
    customRender(<RightMenu mode="vertical"></RightMenu>);
    expect(screen.getByTestId('isDarkModeSwitch')).toBeChecked();
  });

  it('gives precedence to stored preference over prefers-color-scheme', () => {
    setMedia({
      'prefers-color-scheme': 'dark',
    });
    localStorage.setItem(isDarkModeAtom.key, 'false');
    render(
      <RecoilRoot>
        <MemoryRouter>
          <RightMenu mode="vertical"></RightMenu>
        </MemoryRouter>
      </RecoilRoot>
    );
    expect(screen.getByTestId('isDarkModeSwitch')).toBeChecked();
  });

  it('stores preference when selected', async () => {
    setMedia({});
    localStorage.clear();
    customRender(<RightMenu mode="vertical"></RightMenu>);
    const isDarkModeSwitch = await screen.findByTestId('isDarkModeSwitch');
    expect(isDarkModeSwitch).not.toBeChecked();
    waitFor(() => {
      fireEvent.click(isDarkModeSwitch);
    });
    expect(await screen.findByTestId('isDarkModeSwitch')).toBeChecked();
    expect(localStorage.getItem(isDarkModeAtom.key)).toBe('false');
  });
});
