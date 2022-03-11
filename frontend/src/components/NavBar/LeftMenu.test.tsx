import { act, fireEvent, render, waitFor } from '@testing-library/react';
import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { projectsFixture } from '../../api/mock/fixtures';
import LeftMenu, { Props } from './LeftMenu';

const defaultProps: Props = {
  projects: projectsFixture(),
  apiIsLoading: false,
  apiError: undefined,
  onTextSearch: jest.fn(),
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

it('renders no component if there is no error, not loading, and no projects fetched', () => {
  const { container } = render(
    <Router>
      <LeftMenu {...defaultProps} projects={undefined} />
    </Router>
  );

  expect(container.firstChild).toEqual(null);
});

it('successfully submits search form and resets current text with onFinish', async () => {
  const { getByPlaceholderText, getByRole } = render(
    <Router>
      <LeftMenu {...defaultProps} />
    </Router>
  );

  // Change form field values
  const input = getByPlaceholderText(
    'Search for a keyword'
  ) as HTMLInputElement;
  act(() => {
    fireEvent.change(input, { target: { value: 'Solar' } });
  });
  expect(input.value).toEqual('Solar');

  // Submit the form
  const submitBtn = getByRole('img', { name: 'search' });
  act(() => {
    fireEvent.submit(submitBtn);
  });

  // Check if the input value resets back to blank
  await waitFor(() => expect(input.value).toEqual(''));
});
