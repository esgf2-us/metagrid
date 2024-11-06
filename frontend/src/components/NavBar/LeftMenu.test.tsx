import React from 'react';
import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { projectsFixture } from '../../test/mock/fixtures';
import LeftMenu, { Props } from './LeftMenu';
import customRender from '../../test/custom-render';

const defaultProps: Props = {
  projects: projectsFixture(),
  apiIsLoading: false,
  apiError: undefined,
  onTextSearch: jest.fn(),
};

const user = userEvent.setup();

it('renders search input', async () => {
  // NOTE: Since the Select component can't be set, this test only checks if
  // the Search form field's value changes. It does not test calling the
  // onFinish function when the user submits the form.
  customRender(<LeftMenu {...defaultProps} />);

  expect(await screen.findByTestId('left-menu')).toBeTruthy();
});

it('renders no component if there is no error, not loading, and no projects fetched', () => {
  const { container } = customRender(
    <LeftMenu {...defaultProps} projects={undefined} />
  );

  expect(container.firstChild?.firstChild).toEqual(null);
});

it('successfully submits search form and resets current text with onFinish', async () => {
  customRender(<LeftMenu {...defaultProps} />);

  // Change form field values
  const input: HTMLInputElement = await screen.findByPlaceholderText(
    'Search for a keyword'
  );

  await act(async () => {
    await user.type(input, 'Solar');
  });
  expect(input.value).toEqual('Solar');

  // Submit the form
  const submitBtn = await screen.findByRole('img', { name: 'search' });
  await act(async () => {
    await user.click(submitBtn);
  });

  // Check if the input value resets back to blank
  expect(input.value).toEqual('');
});
