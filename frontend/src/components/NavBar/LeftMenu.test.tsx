import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react';
import { projectsFixture } from '../../api/mock/fixtures';
import LeftMenu, { Props } from './LeftMenu';
import customRender from '../../test/custom-render';

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
  const { getByTestId } = customRender(<LeftMenu {...defaultProps} />);

  expect(getByTestId('left-menu')).toBeTruthy();
});

it('renders no component if there is no error, not loading, and no projects fetched', () => {
  const { container } = customRender(
    <LeftMenu {...defaultProps} projects={undefined} />
  );

  expect(container.firstChild?.firstChild).toEqual(null);
});

it('successfully submits search form and resets current text with onFinish', async () => {
  const { getByPlaceholderText, getByRole } = customRender(
    <LeftMenu {...defaultProps} />
  );

  // Change form field values
  const input = getByPlaceholderText(
    'Search for a keyword'
  ) as HTMLInputElement;
  fireEvent.change(input, { target: { value: 'Solar' } });
  expect(input.value).toEqual('Solar');

  // Submit the form
  const submitBtn = getByRole('img', { name: 'search' });
  fireEvent.submit(submitBtn);

  // Check if the input value resets back to blank
  await waitFor(() => expect(input.value).toEqual(''));
});
