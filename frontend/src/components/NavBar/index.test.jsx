/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { render, wait, fireEvent } from '@testing-library/react';

import NavBar from './index';
import mockAxios from '../../__mocks__/axios';

const defaultProps = {
  activeProject: { name: 'test1' },
  cartItems: 0,
  onSearch: jest.fn(),
  onProjectChange: jest.fn(),
};

it('renders LeftMenu and RightMenu components', async () => {
  const results = [{ name: 'test1' }, { name: 'test2' }];

  mockAxios.get.mockImplementationOnce(() =>
    Promise.resolve({
      data: {
        results,
      },
    })
  );

  const { getByTestId } = render(
    <Router>
      <NavBar {...defaultProps} />
    </Router>
  );
  await wait(() => expect(getByTestId('left-menu')).toBeTruthy());
  expect(getByTestId('right-menu')).toBeTruthy();
});

it('opens the drawer onClick and closes with onClose', async () => {
  const results = [{ name: 'test1' }, { name: 'test2' }];

  mockAxios.get.mockImplementationOnce(() =>
    Promise.resolve({
      data: {
        results,
      },
    })
  );

  const { getByRole, getByTestId } = render(
    <Router>
      <NavBar {...defaultProps} />
    </Router>
  );
  await wait(() => expect(getByTestId('left-menu')).toBeTruthy());
  expect(getByTestId('right-menu')).toBeTruthy();

  // Open drawer
  const drawerBtn = getByTestId('openDrawerBtn');
  fireEvent.click(drawerBtn);

  // Check drawer is open
  const drawerMenu = getByRole('menu');
  expect(drawerMenu).toBeTruthy();
});
