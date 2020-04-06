/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { render, fireEvent, act } from '@testing-library/react';

import NavBar from './index';
import LeftMenu from './LeftMenu';
import RightMenu from './RightMenu';

const defaultProps = {
  projects: ['test1', 'test2'],
  cartItems: 0,
  onSearch: jest.fn(),
  onProjectChange: jest.fn(),
};

test('LeftMenu and RightMenu components render correctly', async () => {
  await act(async () => {
    const { getByTestId } = render(<NavBar {...defaultProps} />);
    expect(getByTestId('left-menu')).toBeTruthy();
    expect(getByTestId('right-menu')).toBeTruthy();
  });
});

const leftMenuProps = {
  projects: ['test1', 'test2'],
  text: '',
  onFinish: jest.fn(),
  handleChange: jest.fn(),
};

test('LeftMenu renders project list and updates', async () => {
  // NOTE:testing ant-design's select component has been proven to be
  // tricky. Attempting to extract the value that the user selects is not
  // straight-forward, so this project does a simple test to see if the
  // DOM node exists or not.
  const { getByText, getByTestId } = render(<LeftMenu {...leftMenuProps} />);
  expect(getByTestId('left-menu')).toBeTruthy();
  expect(getByText('Project')).toBeTruthy();
  fireEvent.click(getByTestId('project-select'));
});

test('LeftMenu registers search input', async () => {
  // NOTE: Since the Select component can't be set, this test only checks if
  // the Search form field's value changes. It does not test calling the
  // onFinish function when the user submits the form.
  const { getByPlaceholderText, getByRole } = render(
    <LeftMenu {...leftMenuProps} />
  );

  const search = getByPlaceholderText('Search...');
  fireEvent.change(search, { target: { value: 'Solar' } });
  expect(search.value).toBe('Solar');

  fireEvent.click(getByRole('img'));
});

test('RightMenu displays correct number of cartItems', () => {
  const { getByText } = render(<RightMenu cartItems={4} />);
  expect(getByText('4')).toBeTruthy();
});

test('RightMenu links redirect', () => {
  // TODO: After integrating react-router and respective links
  test.todo('placeholder');
});
