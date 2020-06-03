/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { render } from '@testing-library/react';
import RightMenu, { Props } from './RightMenu';

const rightMenuProps: Props = {
  mode: 'horizontal',
  numCartItems: 4,
  numSavedSearches: 1,
};

test('RightMenu displays correct number of cartItems', () => {
  const { getByText } = render(
    <Router>
      <RightMenu {...rightMenuProps} />
    </Router>
  );
  expect(getByText('4')).toBeTruthy();
});
