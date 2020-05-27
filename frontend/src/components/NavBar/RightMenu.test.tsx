/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { render } from '@testing-library/react';
import RightMenu from './RightMenu';

const rightMenuProps: {
  mode:
    | 'horizontal'
    | 'vertical'
    | 'vertical-left'
    | 'vertical-right'
    | 'inline';
  cartItems: number;
} = {
  mode: 'horizontal',
  cartItems: 4,
};

test('RightMenu displays correct number of cartItems', () => {
  const { getByText } = render(
    <Router>
      <RightMenu {...rightMenuProps} />
    </Router>
  );
  expect(getByText('4')).toBeTruthy();
});
