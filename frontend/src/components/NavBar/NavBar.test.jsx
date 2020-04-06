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
  const { getByText, getByTestId } = render(<LeftMenu {...leftMenuProps} />);
  expect(getByTestId('left-menu')).toBeTruthy();
  expect(getByText('Project')).toBeTruthy();
  fireEvent.click(getByTestId('project-select'));
  // TODO: project-options render outside of the component, so use entire container and select
});

test('LeftMenu registers search input', async () => {
  const { getByPlaceholderText } = render(<LeftMenu {...leftMenuProps} />);

  const search = getByPlaceholderText('Search...');
  fireEvent.change(search, { target: { value: 'Solar' } });
  expect(search.value).toBe('Solar');
});

test('RightMenu displays correct number of cartItems', () => {
  const { getByText } = render(<RightMenu cartItems={4} />);
  expect(getByText('4')).toBeTruthy();
});

test('RightMenu links redirect', () => {
  test.todo('placeholder');
});
