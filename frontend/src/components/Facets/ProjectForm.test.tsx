import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import { ResponseError } from '../../api';
import {
  activeSearchQueryFixture,
  projectsFixture,
} from '../../api/mock/fixtures';
import { mapHTTPErrorCodes } from '../../api/routes';
import ProjectsForm, { Props } from './ProjectForm';

const defaultProps: Props = {
  activeSearchQuery: activeSearchQueryFixture(),
  projectsFetched: { results: projectsFixture() },
  apiIsLoading: false,
  apiError: undefined,
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
    <ProjectsForm
      {...defaultProps}
      apiError={
        new Error(mapHTTPErrorCodes('service', 'generic')) as ResponseError
      }
    />
  );

  const alertComponent = getByRole('img', { name: 'close-circle' });
  expect(alertComponent).toBeTruthy();
});
