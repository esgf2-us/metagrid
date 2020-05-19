/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { render, wait } from '@testing-library/react';

import NavBar from './index';
import mockAxios from '../../__mocks__/axios';

const defaultProps = {
  activeProject: { name: 'test1' },
  cartItems: 0,
  onSearch: jest.fn(),
  onProjectChange: jest.fn(),
};

test('LeftMenu and RightMenu components render correctly', async () => {
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
