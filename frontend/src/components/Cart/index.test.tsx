import userEvent from '@testing-library/user-event';
import React from 'react';
import { act } from '@testing-library/react';
import {
  userCartFixture,
  userSearchQueriesFixture,
} from '../../api/mock/fixtures';
import Cart, { Props } from './index';
import customRender from '../../test/custom-render';

const defaultProps: Props = {
  userCart: userCartFixture(),
  userSearchQueries: userSearchQueriesFixture(),
  onUpdateCart: jest.fn(),
  onClearCart: jest.fn(),
  onRunSearchQuery: jest.fn(),
  onRemoveSearchQuery: jest.fn(),
};

const user = userEvent.setup();

let mockNavigate: () => void;
beforeEach(() => {
  mockNavigate = jest.fn();
  jest.mock(
    'react-router-dom',
    () =>
      ({
        ...jest.requireActual('react-router-dom'),
        useNavigate: () => ({
          push: mockNavigate,
        }),
      } as Record<string, unknown>)
  );
});

afterEach(() => {
  jest.clearAllMocks();
});

it('handles tab switching and saved search actions', async () => {
  const { findByRole, findByTestId } = customRender(<Cart {...defaultProps} />);

  // Check cart tab renders
  const cart = await findByTestId('cart');
  expect(cart).toBeTruthy();

  // Check Search Library Tab renders and click it
  const searchLibraryTab = await findByRole('tab', {
    name: 'book Search Library',
    hidden: true,
  });

  expect(searchLibraryTab).toBeTruthy();
  await act(async () => {
    await user.click(searchLibraryTab);
  });

  // Check JSON link renders and click it
  const jsonLink = await findByRole('link');
  expect(jsonLink).toBeTruthy();
  await act(async () => {
    await user.click(jsonLink);
  });

  // Wait for cart to re-render
  await findByTestId('cart');
  // Check apply search button renders and click it
  const applyBtn = await findByRole('img', { name: 'search', hidden: true });
  expect(applyBtn).toBeTruthy();

  await act(async () => {
    await user.click(applyBtn);
  });

  // Wait for cart to re-render
  await findByTestId('cart');

  // Check delete button renders and click it
  const deleteBtn = await findByRole('img', { name: 'delete', hidden: true });
  expect(deleteBtn).toBeTruthy();

  await act(async () => {
    await user.click(deleteBtn);
  });
});
