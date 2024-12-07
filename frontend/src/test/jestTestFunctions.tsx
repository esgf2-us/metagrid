/**
 * This file contains tests for the App component.
 *
 * The App component uses React Router and React Context, so it must be wrapped
 * in order to mock their behaviors.
 *
 */
import { within, screen, act } from '@testing-library/react';
import { message } from 'antd';
import { ReactNode, CSSProperties } from 'react';
import { UserEvent } from '@testing-library/user-event';
import { NotificationType, getSearchFromUrl } from '../common/utils';
import { RawSearchResult } from '../components/Search/types';
import { rawSearchResultFixture } from './mock/fixtures';
import { FrontendConfig } from '../common/types';

// https://www.mikeborozdin.com/post/changing-jest-mocks-between-tests
export const originalGlobusEnabledNodes = [
  'aims3.llnl.gov',
  'esgf-data1.llnl.gov',
  'esgf-data2.llnl.gov',
];

export const mockConfig: FrontendConfig = {
  REACT_APP_GLOBUS_CLIENT_ID: 'frontend',
  REACT_APP_GLOBUS_REDIRECT: 'http://localhost:8080/cart/items',
  REACT_APP_GLOBUS_NODES: originalGlobusEnabledNodes,
  REACT_APP_KEYCLOAK_REALM: 'esgf',
  REACT_APP_KEYCLOAK_URL: 'http://localhost:1337',
  REACT_APP_KEYCLOAK_CLIENT_ID: 'frontend',
  REACT_APP_HOTJAR_ID: 1234,
  REACT_APP_HOTJAR_SV: 1234,
  REACT_APP_AUTHENTICATION_METHOD: 'keycloak',
  REACT_APP_GOOGLE_ANALYTICS_TRACKING_ID: 'UA-XXXXXXXXX-YY',
};

export const activeSearch = getSearchFromUrl();

export const sessionStorageMock = (() => {
  let store: { [key: string]: unknown } = {};

  return {
    getItem<T>(key: string): T {
      return store[key] as T;
    },

    setItem<T>(key: string, value: T): void {
      store[key] = value;
    },

    clear() {
      store = {};
    },

    removeItem(key: string) {
      delete store[key];
    },

    getAll() {
      return store;
    },
  };
})();

// This will get a mock value from temp storage to use for keycloak
export const mockKeycloakToken = mockFunction(() => {
  const loginFixture = tempStorageGetMock('keycloakFixture');

  if (loginFixture) {
    return loginFixture;
  }
  return {
    keycloak: {
      login: jest.fn(),
      logout: jest.fn(),
      idTokenParsed: { given_name: 'John' },
    },
  };
});

export function tempStorageGetMock<T>(key: string): T {
  const value = sessionStorageMock.getItem<T>(key);
  // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
  return value;
}

export function tempStorageSetMock<T>(key: string, value: T): void {
  sessionStorageMock.setItem<T>(key, value);
}

export function mockFunction<T extends (...args: unknown[]) => unknown>(
  fn: T
): jest.MockedFunction<T> {
  return fn as jest.MockedFunction<T>;
}

export function printElementContents(element: HTMLElement | undefined): void {
  screen.debug(element, Number.POSITIVE_INFINITY);
}

export async function showNoticeStatic(
  content: React.ReactNode | string,
  config?: {
    duration?: number;
    icon?: ReactNode;
    type?: NotificationType;
    style?: CSSProperties;
    key?: string | number;
  }
): Promise<void> {
  const msgConfig = {
    content,
    duration: config?.duration,
    icon: config?.icon,
    style: {
      marginTop: '60px',
      marginLeft: '20%',
      width: '60%',
      height: '500px',
      overflow: 'auto',
      ...config?.style,
    },
    key: config?.key,
  };

  switch (config?.type) {
    case 'success':
      await message.success(msgConfig);
      /* istanbul ignore next */
      return;
    case 'warning':
      await message.warning(msgConfig);
      /* istanbul ignore next */
      return;
    case 'error':
      await message.error(msgConfig);
      /* istanbul ignore next */
      return;
    case 'info':
      await message.info(msgConfig);
      /* istanbul ignore next */
      return;
    default:
      await message.info(msgConfig);
      /* istanbul ignore next */
      break;
  }
}

export const globusReadyNode = 'nodeIsGlobusReady';
export const nodeNotGlobusReady = 'nodeIsNotGlobusReady';

export function makeCartItem(id: string, globusReady: boolean): RawSearchResult {
  return rawSearchResultFixture({
    id,
    title: id,
    master_id: id,
    number_of_files: 3,
    data_node: globusReady ? globusReadyNode : nodeNotGlobusReady,
  });
}

export async function submitKeywordSearch(inputText: string, user: UserEvent): Promise<void> {
  // Check left menu rendered
  const leftMenuComponent = await screen.findByTestId('left-menu');
  expect(leftMenuComponent).toBeTruthy();

  // Type in value for free-text input
  const freeTextForm = await screen.findByPlaceholderText('Search for a keyword');
  expect(freeTextForm).toBeTruthy();

  await act(async () => {
    await user.type(freeTextForm, inputText);
  });

  // Submit the form
  const submitBtn = await within(leftMenuComponent).findByRole('img', {
    name: 'search',
  });

  await act(async () => {
    await user.click(submitBtn);
  });

  await screen.findByTestId('search');
}

export async function openDropdownList(user: UserEvent, dropdown: HTMLElement): Promise<void> {
  dropdown.focus();
  await act(async () => {
    await user.keyboard('[ArrowDown]');
  });
}

export async function addSearchRowsAndGoToCart(
  user: UserEvent,
  rows?: HTMLElement[]
): Promise<void> {
  let rowsToAdd: HTMLElement[] = [];

  // Get the rows we need to add
  if (rows) {
    rowsToAdd = rowsToAdd.concat(rows);
  } else {
    const defaultRow = await screen.findByTestId('cart-items-row-1');
    rowsToAdd.push(defaultRow);
  }

  // Add the rows by clicking plus button
  const clickBtns: Promise<void>[] = [];
  rowsToAdd.forEach((row) => {
    expect(row).toBeTruthy();
    const clickBtnFunc = async (): Promise<void> => {
      const addBtn = (await within(row).findAllByRole('button'))[0];
      expect(addBtn).toBeTruthy();
      await act(async () => {
        await user.click(addBtn);
      });
    };
    clickBtns.push(clickBtnFunc());
  });
  await Promise.all(clickBtns);

  // Check 'Added items(s) to the cart' message appears
  const addText = await screen.findAllByText('Added item(s) to your cart', {
    exact: false,
  });
  expect(addText).toBeTruthy();

  // Switch to the cart page
  const cartBtn = await screen.findByTestId('cartPageLink');
  await act(async () => {
    await user.click(cartBtn);
  });

  // Wait for cart page to render
  const summary = await screen.findByTestId('summary');
  expect(summary).toBeTruthy();
}
