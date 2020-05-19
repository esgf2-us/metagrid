/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { render, fireEvent, wait } from '@testing-library/react';
import LeftMenu from './LeftMenu';

const leftMenuProps = {
  activeProject: { name: 'test1' },
  projects: [{ name: 'test1' }, { name: 'test2' }],
  onSearch: jest.fn(),
  onProjectChange: jest.fn(),
};

it('renders search input', async () => {
  // NOTE: Since the Select component can't be set, this test only checks if
  // the Search form field's value changes. It does not test calling the
  // onFinish function when the user submits the form.
  const { getByTestId } = render(
    <Router>
      <LeftMenu {...leftMenuProps} />
    </Router>
  );

  expect(getByTestId('left-menu')).toBeTruthy();
});

it('successfully submits search form and resets current text with onFinish', async () => {
  const { getByPlaceholderText, getByRole } = render(
    <Router>
      <LeftMenu {...leftMenuProps} />
    </Router>
  );

  // Change form field values
  const input = getByPlaceholderText('Search...');
  fireEvent.change(input, { target: { value: 'Solar' } });
  expect(input.value).toEqual('Solar');

  // Submit the form
  const submitBtn = getByRole('img', { name: 'search' });
  fireEvent.submit(submitBtn);

  // Check if the input value resets back to blank
  await wait(() => expect(input.value).toEqual(''));
});

it('successfully submits search form and resets current text with onFinish, and updates activeProject when activeProject !== selectedProj', async () => {
  const onProjectChange = jest.fn();
  const { getByPlaceholderText, getByRole } = render(
    <Router>
      <LeftMenu
        {...leftMenuProps}
        activeProject={{}}
        onProjectChange={onProjectChange}
      />
    </Router>
  );

  // Change form field values
  const input = getByPlaceholderText('Search...');
  fireEvent.change(input, { target: { value: 'Solar' } });
  expect(input.value).toEqual('Solar');

  // Submit the form
  const submitBtn = getByRole('img', { name: 'search' });
  fireEvent.submit(submitBtn);

  // Check if the input value resets back to blank
  await wait(() => expect(input.value).toEqual(''));
  expect(onProjectChange).toHaveBeenCalled();
});
