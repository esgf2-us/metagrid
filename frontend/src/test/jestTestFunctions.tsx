/**
 * This file contains tests for the App component.
 *
 * The App component uses React Router and React Context, so it must be wrapped
 * in order to mock their behaviors.
 *
 */
import {
  waitFor,
  within,
  screen,
  RenderResult,
  act,
} from '@testing-library/react';
import { UserEvent } from '@testing-library/user-event/dist/types/setup/setup';
import { message } from 'antd';
import { ReactNode, CSSProperties } from 'react';
import * as enviroConfig from '../env';
import { NotificationType, getSearchFromUrl } from '../common/utils';

// For mocking environment variables
export type MockConfig = {
  authenticationMethod: string;
  globusEnabledNodes: string[];
};

// For mocking environment variables
// https://www.mikeborozdin.com/post/changing-jest-mocks-between-tests
export const mockConfig: MockConfig = enviroConfig;

export const originalEnabledNodes = [
  'aims3.llnl.gov',
  'esgf-data1.llnl.gov',
  'esgf-data2.llnl.gov',
];

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

/**
 * Creates the appropriate name string when performing getByRole('row')
 */
export function getRowName(
  cartButton: 'plus' | 'minus',
  nodeCircleType: 'question' | 'check' | 'close',
  title: string,
  fileCount: string,
  totalSize: string,
  version: string,
  globusReady?: boolean
): RegExp {
  let totalBytes = `${totalSize} Bytes`;
  if (Number.isNaN(Number(totalSize))) {
    totalBytes = totalSize;
  }
  let globusReadyCheck = '.*';
  if (globusReady !== undefined) {
    globusReadyCheck = globusReady ? 'check-circle' : 'close-circle';
  }
  const newRegEx = new RegExp(
    `right-circle ${cartButton} ${nodeCircleType}-circle ${title} ${fileCount} ${totalBytes} ${version} wget download ${globusReadyCheck}`
  );

  return newRegEx;
}

export async function submitKeywordSearch(
  renderedApp: RenderResult,
  inputText: string,
  user: UserEvent
): Promise<void> {
  const { getByTestId, getByPlaceholderText } = renderedApp;

  // Check left menu rendered
  const leftMenuComponent = await waitFor(() => getByTestId('left-menu'));
  expect(leftMenuComponent).toBeTruthy();

  // Type in value for free-text input
  const freeTextForm = await waitFor(() =>
    getByPlaceholderText('Search for a keyword')
  );
  expect(freeTextForm).toBeTruthy();

  await act(async () => {
    await user.type(freeTextForm, inputText);
  });

  // Submit the form
  const submitBtn = within(leftMenuComponent).getByRole('img', {
    name: 'search',
  });

  await act(async () => {
    await user.click(submitBtn);
  });

  await waitFor(() => getByTestId('search'));
}

export async function openDropdownList(
  user: UserEvent,
  dropdown: HTMLElement
): Promise<void> {
  await waitFor(async () => {
    dropdown.focus();
    await act(async () => {
      await user.keyboard('[ArrowDown]');
    });
  });
}

export async function selectDropdownOption(
  user: UserEvent,
  dropdown: HTMLElement,
  option: string
): Promise<void> {
  await waitFor(
    async () => {
      dropdown.focus();
      await act(async () => {
        await user.keyboard('[ArrowDown]');
      });
      await act(async () => {
        await user.click(screen.getByText(option));
      });
    },
    { timeout: 3000 }
  );
}
