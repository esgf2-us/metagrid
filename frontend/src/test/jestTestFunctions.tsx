/* eslint-disable no-console */
/**
 * This file contains tests for the App component.
 *
 * The App component uses React Router and React Context, so it must be wrapped
 * in order to mock their behaviors.
 *
 */
import { screen } from '@testing-library/react';
import { message } from 'antd';
import React, { ReactNode, CSSProperties } from 'react';
import { UserEvent } from '@testing-library/user-event';
import { Provider, WritableAtom } from 'jotai';
import { useHydrateAtoms } from 'jotai/utils';
import { NotificationType, getSearchFromUrl, saveToLocalStorage } from '../common/utils';
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
  STATUS_URL: 'https://node-status',
  BANNER_TEXT: null,
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
  content: React.ReactElement | string,
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

type AnyWritableAtom = WritableAtom<unknown, never[], unknown>;
export type InitialAtomValues = Array<readonly [AnyWritableAtom, unknown]>;

const HydrateAtoms = ({
  children,
  initialValues,
}: {
  children: React.ReactElement;
  initialValues: InitialAtomValues;
}): React.ReactElement => {
  useHydrateAtoms(new Map(initialValues));
  return <>{children}</>;
};

const TestProvider = ({
  initialValues,
  children,
}: {
  children: React.ReactElement;
  initialValues: InitialAtomValues;
}): React.ReactElement => (
  <Provider>
    <HydrateAtoms initialValues={initialValues}>{children}</HydrateAtoms>
  </Provider>
);

export class AtomWrapper {
  private static instance: AtomWrapper;

  private ATOMS: {
    [key: string]: {
      atom: AnyWritableAtom;
      value: unknown;
      prevValue: unknown;
      saveLocal: boolean;
    };
  } = {};

  private constructor() {
    this.ATOMS = {};
  }

  public static get Instance(): AtomWrapper {
    if (!this.instance) {
      this.instance = new this();
    }
    return this.instance;
  }

  public static listEntries(): void {
    const instance = this.Instance;
    Object.keys(instance.ATOMS).forEach((key) => {
      const atomInfo = instance.ATOMS[key];
      console.log(`Key: ${key}`);
      console.log(`Atom: ${atomInfo.atom.toString()}`);
      console.log(`Value: ${JSON.stringify(atomInfo.value)}`);
      console.log(`Previous Value: ${JSON.stringify(atomInfo.prevValue)}`);
      console.log(`Save Local: ${atomInfo.saveLocal}`);
      console.log('-------------------');
    });
  }

  public static setAtomValue<T>(
    atom: AnyWritableAtom,
    key: string,
    value: T,
    saveLocal: boolean
  ): AtomWrapper {
    const instance = this.Instance;
    instance.ATOMS[key] = {
      atom,
      value,
      prevValue: null,
      saveLocal,
    };
    return instance;
  }

  public static getAtomValue<T>(key: string): T {
    return this.Instance.ATOMS[key].value as T;
  }

  public static modifyAtomValue<T>(key: string, value: T): AtomWrapper {
    const instance = this.Instance;
    if (instance.ATOMS[key]) {
      instance.ATOMS[key].prevValue = instance.ATOMS[key].value;
      instance.ATOMS[key].value = value;
    } else {
      console.error(`Atom ${key} not found in AtomWrapper. Please set the atom value first.`);
    }

    return instance;
  }

  public static restoreValues(): AtomWrapper {
    const instance = this.Instance;
    Object.keys(instance.ATOMS).forEach((key) => {
      const atomInfo = instance.ATOMS[key];
      if (atomInfo.prevValue) {
        atomInfo.value = atomInfo.prevValue;
        atomInfo.prevValue = null;
      }
    });
    return instance;
  }

  public static wrap(children: React.ReactElement): React.ReactElement {
    const instance = this.Instance;
    const initValues: InitialAtomValues = [];

    Object.keys(instance.ATOMS).forEach((key) => {
      const atomInfo = instance.ATOMS[key];

      // Save the atoms to the local storage
      if (atomInfo.saveLocal) {
        saveToLocalStorage(key, atomInfo.value);
      }
      initValues.push([atomInfo.atom, atomInfo.value]);
    });

    return <TestProvider initialValues={initValues}>{children}</TestProvider>;
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
