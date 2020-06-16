/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { render, fireEvent, waitFor } from '@testing-library/react';
import LeftMenu, { Props } from './LeftMenu';
import { projectsFixture } from '../../test/fixtures';

const defaultProps: Props = {
  activeProject: { name: 'test1' },
  projects: projectsFixture(),
  onSearch: jest.fn(),
  onProjectChange: jest.fn(),
};

it('renders search input', () => {
  // NOTE: Since the Select component can't be set, this test only checks if
  // the Search form field's value changes. It does not test calling the
  // onFinish function when the user submits the form.
  const { getByTestId } = render(
    <Router>
      <LeftMenu {...defaultProps} />
    </Router>
  );

  expect(getByTestId('left-menu')).toBeTruthy();
});

it('successfully submits search form and resets current text with onFinish', async () => {
  const { getByPlaceholderText, getByRole } = render(
    <Router>
      <LeftMenu {...defaultProps} />
    </Router>
  );

  // Change form field values
  const input = getByPlaceholderText('Search...') as HTMLInputElement;
  fireEvent.change(input, { target: { value: 'Solar' } });
  expect(input.value).toEqual('Solar');

  // Submit the form
  const submitBtn = getByRole('img', { name: 'search' });
  fireEvent.submit(submitBtn);

  // Check if the input value resets back to blank
  await waitFor(() => expect(input.value).toEqual(''));
});

it('successfully submits search form and resets current text with onFinish, and updates activeProject when activeProject !== selectedProj', async () => {
  const onProjectChange = jest.fn();
  const { getByPlaceholderText, getByRole } = render(
    <Router>
      <LeftMenu
        {...defaultProps}
        activeProject={{}}
        onProjectChange={onProjectChange}
      />
    </Router>
  );

  // Change form field values
  const input = getByPlaceholderText('Search...') as HTMLInputElement;
  fireEvent.change(input, { target: { value: 'Solar' } });
  expect(input.value).toEqual('Solar');

  // Submit the form
  const submitBtn = getByRole('img', { name: 'search' });
  fireEvent.submit(submitBtn);

  // Check if the input value resets back to blank
  await waitFor(() => expect(input.value).toEqual(''));
  expect(onProjectChange).toHaveBeenCalled();
});
