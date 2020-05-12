/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { render } from '@testing-library/react';

import Search from './index';

const defaultProps = {
  activeProject: {},
  textInputs: [],
  activeFacets: {},
  cart: [],
  onRemoveTag: jest.fn(),
  onClearTags: jest.fn(),
  onAddCart: jest.fn(),
  handleCart: jest.fn(),
  setAvailableFacets: jest.fn(),
};

test('renders without crashing', async () => {
  const { getByTestId } = render(<Search {...defaultProps} />);
  expect(getByTestId('search')).toBeTruthy();
});

test('successfully shows results', async () => {
  test.todo('placeholder');
});

test('successfully shows applied constraints', async () => {
  test.todo('placeholder');
});
