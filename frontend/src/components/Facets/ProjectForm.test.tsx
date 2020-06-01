/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { fireEvent, render } from '@testing-library/react';

import ProjectsForm, { Props } from './ProjectForm';

const defaultProps: Props = {
  activeProject: { name: 'foo' },
  activeFacets: { facet1: ['foo'] },
  projectsIsLoading: false,
  projectsFetched: { results: [{ name: 'foo', facets_url: 'foo.bar' }] },
  handleProjectForm: jest.fn(),
};

it('renders Popconfirm component when there is an activeProject and activeFacet(s)', () => {
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
