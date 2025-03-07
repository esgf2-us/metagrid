/**
 * This file contains tests for the App component.
 *
 * The App component uses React Router and React Context, so it must be wrapped
 * in order to mock their behaviors.
 *
 */
import { within, screen } from '@testing-library/react';
import { message } from 'antd';
import React, { ReactNode, CSSProperties } from 'react';
import { UserEvent } from '@testing-library/user-event';
import { RecoilState, RecoilRoot } from 'recoil';
import { NotificationType, getSearchFromUrl } from '../common/utils';
import { RawSearchResult } from '../components/Search/types';
import { rawSearchResultFixture } from './mock/fixtures';
import { FrontendConfig } from '../common/types';
import { tempStorageGetMock } from './mock/mockStorage';

// https://www.mikeborozdin.com/post/changing-jest-mocks-between-tests
export const originalGlobusEnabledNodes = [
  'aims3.llnl.gov',
  'esgf-data1.llnl.gov',
  'esgf-data2.llnl.gov',
];

export const mockConfig: FrontendConfig = {
  GLOBUS_CLIENT_ID: 'frontend',
  GLOBUS_NODES: originalGlobusEnabledNodes,
  KEYCLOAK_REALM: 'esgf',
  KEYCLOAK_URL: 'http://localhost:1337',
  KEYCLOAK_CLIENT_ID: 'frontend',
  HOTJAR_ID: 1234,
  HOTJAR_SV: 1234,
  AUTHENTICATION_METHOD: 'keycloak',
  FOOTER_TEXT: 'Footer text',
  GOOGLE_ANALYTICS_TRACKING_ID: 'UA-XXXXXXXXX-YY',
};

export const activeSearch = getSearchFromUrl();

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

export function mockFunction<T extends (...args: unknown[]) => unknown>(
  fn: T
): jest.MockedFunction<T> {
  return fn as jest.MockedFunction<T>;
}

export function printElementContents(element: HTMLElement | undefined = undefined): void {
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

export const globusReadyNode: string = 'nodeIsGlobusReady';
export const nodeNotGlobusReady: string = 'nodeIsNotGlobusReady';

export class RecoilWrapper {
  settings: Array<{ atom: RecoilState<unknown>; value: unknown }> = [];

  addSetting<T>(recoilAtom: RecoilState<T>, value: T, persistent: boolean = true): void {
    if (persistent) {
      saveToLocalStorage(recoilAtom.key, value);
      return;
    }
    this.settings.push({ atom: recoilAtom as RecoilState<unknown>, value: value as unknown });
  }

  wrap(children: React.ReactElement): React.ReactElement {
    return (
      <RecoilRoot
        initializeState={(snapshot) => {
          this.settings.forEach((setting) => {
            snapshot.set(setting.atom, setting.value);
          });
        }}
      >
        {children}
      </RecoilRoot>
    );
  }
}

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
  const freeTextForm = await screen.findByTestId('left-menu-keyword-search-input');
  expect(freeTextForm).toBeTruthy();

  await user.type(freeTextForm, inputText);

  // Submit the form
  const submitBtn = await screen.findByTestId('left-menu-keyword-search-submit');
  await user.click(submitBtn);

  await screen.findByTestId('search');
}

export async function openDropdownList(user: UserEvent, dropdown: HTMLElement): Promise<void> {
  await user.click(dropdown);
}

export function saveToLocalStorage<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
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
      await user.click(addBtn);
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
  await user.click(cartBtn);

  // Wait for cart page to render
  const summary = await screen.findByTestId('summary');
  expect(summary).toBeTruthy();
}
