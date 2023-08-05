import React from 'react';
import userEvent from '@testing-library/user-event';
import { ResponseError } from '../../api';
import {
  activeSearchQueryFixture,
  projectsFixture,
} from '../../api/mock/fixtures';
import { mapHTTPErrorCodes } from '../../api/routes';
import ProjectsForm, { Props } from './ProjectForm';
import { customRender } from '../../test/custom-render';

const user = userEvent.setup();

const defaultProps: Props = {
  activeSearchQuery: activeSearchQueryFixture(),
  projectsFetched: { results: projectsFixture() },
  apiIsLoading: false,
  apiError: undefined,
  onFinish: jest.fn(),
};

it('renders Popconfirm component when there is an active project and active facets', async () => {
  const { getByRole, getByText } = customRender(
    <ProjectsForm {...defaultProps} />
  );

  // Click the submit button
  const submitBtn = getByRole('img', { name: 'select' });
  await user.click(submitBtn);

  // Check popover exists
  const popOver = getByRole('img', { name: 'question-circle' });
  expect(popOver).toBeTruthy();

  // Submit popover
  const popOverSubmitBtn = getByText('OK');
  await user.click(popOverSubmitBtn);
});

it('renders empty form', () => {
  const { queryByRole } = customRender(
    <ProjectsForm {...defaultProps} projectsFetched={undefined} />
  );

  // Check submit button does not exist
  const submitBtn = queryByRole('img', { name: 'select' });
  expect(submitBtn).toBeNull();
});

it('renders error message when projects can"t be fetched', () => {
  const { getByRole } = customRender(
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
