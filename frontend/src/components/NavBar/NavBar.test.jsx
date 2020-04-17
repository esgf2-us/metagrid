/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { render, fireEvent, act } from '@testing-library/react';

import NavBar from './index';
import LeftMenu from './LeftMenu';
import RightMenu from './RightMenu';

const defaultProps = {
  project: 'test1',
  projects: ['test1', 'test2'],
  cartItems: 0,
  onSearch: jest.fn(),
  onProjectChange: jest.fn(),
};

test('LeftMenu and RightMenu components render correctly', async () => {
  await act(async () => {
    const { getByTestId } = render(
      <Router>
        <NavBar {...defaultProps} />
      </Router>
    );
    expect(getByTestId('left-menu')).toBeTruthy();
    expect(getByTestId('right-menu')).toBeTruthy();
  });
});

const leftMenuProps = {
  project: 'test1',
  projects: ['test1', 'test2'],
  onSearch: jest.fn(),
  onProjectChange: jest.fn(),
};

test('LeftMenu renders project list and updates', async () => {
  // NOTE: Testing ant-design's select component has been proven to be
  // tricky. Attempting to extract the value that the user selects is not
  // straight-forward, so this project does a simple test to see if the
  // DOM node exists or not.
  const { getByText, getByTestId } = render(
    <Router>
      <LeftMenu {...leftMenuProps} />
    </Router>
  );
  expect(getByTestId('left-menu')).toBeTruthy();
  expect(getByText('Project')).toBeTruthy();
  fireEvent.click(getByTestId('project-select'));
});

test('LeftMenu registers search input', async () => {
  // NOTE: Since the Select component can't be set, this test only checks if
  // the Search form field's value changes. It does not test calling the
  // onFinish function when the user submits the form.
  const { getByPlaceholderText, getByRole } = render(
    <Router>
      <LeftMenu {...leftMenuProps} />
    </Router>
  );

  const search = getByPlaceholderText('Search...');
  fireEvent.change(search, { target: { value: 'Solar' } });
  expect(search.value).toBe('Solar');

  fireEvent.click(getByRole('img'));
});

const rightMenuProps = {
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

test('RightMenu links redirect', () => {
  // TODO: After integrating react-router and respective links
  test.todo('placeholder');
});
