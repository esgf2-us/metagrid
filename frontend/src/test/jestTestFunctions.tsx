/**
 * This file contains tests for the App component.
 *
 * The App component uses React Router and React Context, so it must be wrapped
 * in order to mock their behaviors.
 *
 */
import { waitFor, within, screen, RenderResult } from '@testing-library/react';
import { UserEvent } from '@testing-library/user-event/dist/types/setup/setup';

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

export function tempStorageGetMock<T>(key: string): T {
  const value = sessionStorageMock.getItem<T>(key);
  // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
  console.log('used tempStorageGetMock');
  return value;
}

export function tempStorageSetMock<T>(key: string, value: T): void {
  sessionStorageMock.setItem<T>(key, value);
  console.log('used tempStorageSetMock');
}

export function mockFunction<T extends (...args: any[]) => any>(
  fn: T
): jest.MockedFunction<T> {
  return fn as jest.MockedFunction<T>;
}

export function printElementContents(element: HTMLElement | undefined): void {
  screen.debug(element, Number.POSITIVE_INFINITY);
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
  await user.type(freeTextForm, inputText);

  // Submit the form
  const submitBtn = within(leftMenuComponent).getByRole('img', {
    name: 'search',
  });
  await user.click(submitBtn);

  await waitFor(() => getByTestId('search'));
}
