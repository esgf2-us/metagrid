import { fireEvent, render } from '@testing-library/react';
import React from 'react';
import {
  activeSearchQueryFixture,
  projectsFixture,
} from '../../api/mock/fixtures';
import ProjectsForm, { Props } from './ProjectForm';

const defaultProps: Props = {
  activeSearchQuery: activeSearchQueryFixture(),
  projectsIsLoading: false,
  projectsFetched: { results: projectsFixture() },
  onFinish: jest.fn(),
};

it('renders Popconfirm component when there is an active project and active facets', () => {
  const { getByRole, getByText } = render(<ProjectsForm {...defaultProps} />);

  // Click the submit button
  const submitBtn = getByRole('img', { name: 'select' });
  fireEvent.click(submitBtn);

  // Check popover exists
  const popOver = getByRole('img', { name: 'question-circle' });
  expect(popOver).toBeTruthy();

  // Submit popover
  const popOverSubmitBtn = getByText('OK');
  fireEvent.click(popOverSubmitBtn);
});

it('renders empty form', () => {
  const { queryByRole } = render(
    <ProjectsForm {...defaultProps} projectsFetched={undefined} />
  );

  // Check submit button does not exist
  const submitBtn = queryByRole('img', { name: 'select' });
  expect(submitBtn).toBeNull();
});

it('renders error message when projects can"t be fetched', () => {
  const { getByRole } = render(
    <ProjectsForm {...defaultProps} projectsError={new Error('404')} />
  );

  const alertComponent = getByRole('img', { name: 'close-circle' });
  expect(alertComponent).toBeTruthy();
});
