import React from 'react';
import { fireEvent, render } from '@testing-library/react';

import ProjectsForm from './ProjectForm';

it('renders Popconfirm component when there is an activeProject and activeFacet(s)', () => {
  const { getByRole, getByText } = render(
    <ProjectsForm
      activeProject={{ name: 'foo' }}
      activeFacets={{ facet1: ['foo'] }}
      projectsFetched={{ results: [{ name: 'foo' }] }}
      handleProjectForm={jest.fn()}
    />
  );

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
