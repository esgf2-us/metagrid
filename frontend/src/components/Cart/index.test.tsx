import userEvent from '@testing-library/user-event';
import React from 'react';
import { screen } from '@testing-library/react';
import Cart, { Props } from './index';
import customRender from '../../test/custom-render';

const defaultProps: Props = {
  onUpdateCart: jest.fn(),
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
  customRender(<Cart {...defaultProps} />);

  // Check cart tab renders
  const cart = await screen.findByTestId('cart');
  expect(cart).toBeTruthy();

  // Check Search Library Tab renders and click it
  const searchLibraryTab = await screen.findByRole('tab', {
    name: 'book Search Library',
    hidden: true,
  });

  expect(searchLibraryTab).toBeTruthy();
  await user.click(searchLibraryTab);

  // Check JSON link renders and click it
  const jsonLink = await screen.findByRole('link');
  expect(jsonLink).toBeTruthy();
  await user.click(jsonLink);

  // Wait for cart to re-render
  await screen.findByTestId('cart');
  // Check apply search button renders and click it
  const applyBtn = await screen.findByRole('img', {
    name: 'search',
    hidden: true,
  });
  expect(applyBtn).toBeTruthy();

  await user.click(applyBtn);

  // Wait for cart to re-render
  await screen.findByTestId('cart');

  // Check delete button renders and click it
  const deleteBtn = await screen.findByRole('img', {
    name: 'delete',
    hidden: true,
  });
  expect(deleteBtn).toBeTruthy();

  await user.click(deleteBtn);
});
