/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { fireEvent, render, waitFor, within } from '@testing-library/react';

import Facets, { Props } from './index';
import { parsedFacetsFixture, defaultFacetsFixture } from '../../test/fixtures';

const defaultProps: Props = {
  activeProject: {},
  defaultFacets: defaultFacetsFixture(),
  activeFacets: {},
  availableFacets: parsedFacetsFixture(),
  handleProjectChange: jest.fn(),
  onSetFacets: jest.fn(),
};

it('renders component', async () => {
  const { getByTestId } = render(<Facets {...defaultProps} />);

  // Check FacetsForm component renders
  const facetsForm = await waitFor(() => getByTestId('facets-form'));
  await waitFor(() => expect(facetsForm).toBeTruthy());

  // Check ProjectForm component renders
  const projectForm = await waitFor(() => getByTestId('project-form'));
  expect(projectForm).toBeTruthy();
});

it('handles when the project form is submitted', async () => {
  const { getByTestId } = render(<Facets {...defaultProps} />);

  // Check FacetsForm component renders
  const facetsForm = await waitFor(() => getByTestId('facets-form'));
  await waitFor(() => expect(facetsForm).toBeTruthy());

  // Check ProjectForm component renders
  const projectForm = await waitFor(() => getByTestId('project-form'));
  expect(projectForm).toBeTruthy();

  // Check facet select form exists and mouseDown to expand list of options
  const projectFormSelect = document.querySelector(
    '[data-testid=project-form-select] > .ant-select-selector'
  ) as HTMLInputElement;
  expect(projectFormSelect).toBeTruthy();
  fireEvent.mouseDown(projectFormSelect);

  // Select the first project option
  const projectOption = getByTestId('project_0');
  expect(projectOption).toBeTruthy();
  fireEvent.click(projectOption);

  // Submit the form
  // NOTE: Submit button is inside the form, so use submit
  const projectFormBtn = within(projectForm).getByRole('img', {
    name: 'select',
  });
  fireEvent.submit(projectFormBtn);
});

it('handles facets form submission', async () => {
  const { getByRole, getByTestId, getByText } = render(
    <Facets {...defaultProps} activeProject={{ name: 'test1' }} />
  );

  // Check FacetsForm component renders
  const facetsForm = await waitFor(() => getByTestId('facets-form'));
  await waitFor(() => expect(facetsForm).toBeTruthy());

  // Check ProjectForm component renders
  const projectForm = await waitFor(() => getByTestId('project-form'));
  expect(projectForm).toBeTruthy();

  // Open Collapse Panel in Collapse component for the facet1 form to render
  const collapse = getByText('Facet1');
  fireEvent.click(collapse);

  // Check facet select form exists and mouseDown to expand list of options
  const facetFormSelect = document.querySelector(
    '[data-testid=facet1-form-select] > .ant-select-selector'
  ) as HTMLInputElement;
  expect(facetFormSelect).toBeTruthy();
  fireEvent.mouseDown(facetFormSelect);

  // Select the first facet option
  const facetOption = getByTestId('facet1_foo');
  expect(facetOption).toBeTruthy();
  fireEvent.click(facetOption);

  // Submit the form
  // NOTE: Submit button is outside of the form, so use click instead of submit
  const facetFormBtn = getByRole('button', { name: 'filter Apply Facets' });
  fireEvent.click(facetFormBtn);
});

it('handles facets form submission, including a facet key that is undefined', async () => {
  const { getByRole, getByTestId, getByText } = render(
    <Facets {...defaultProps} activeProject={{ name: 'test1' }} />
  );

  // Check FacetsForm component renders
  const facetsForm = await waitFor(() => getByTestId('facets-form'));
  await waitFor(() => expect(facetsForm).toBeTruthy());

  // Check ProjectForm component renders
  const projectForm = await waitFor(() => getByTestId('project-form'));
  expect(projectForm).toBeTruthy();

  // Open Collapse Panel in Collapse component for the facet1 form to render
  const collapse = getByText('Facet1');
  fireEvent.click(collapse);

  // Check facet select form exists and mouseDown to expand list of options
  const facetFormSelect = document.querySelector(
    '[data-testid=facet1-form-select] > .ant-select-selector'
  ) as HTMLInputElement;
  expect(facetFormSelect).toBeTruthy();
  fireEvent.mouseDown(facetFormSelect);

  // Select the first facet option
  const facetOption = getByTestId('facet1_foo');
  expect(facetOption).toBeTruthy();
  fireEvent.click(facetOption);

  // Submit the form
  // NOTE: Submit button is outside of the form, so use click instead of submit
  const facetFormBtn = getByRole('button', { name: 'filter Apply Facets' });
  fireEvent.click(facetFormBtn);

  // Open Collapse Panel for  in Collapse component for the facet2 form to render
  const collapse2 = getByText('Facet2');
  fireEvent.click(collapse2);

  // Click on the facet2 select form but don't select an option
  // This will result in an undefined value for the form item (ant-design logic)
  // Check facet select form exists and mouseDown to expand list of options
  const facetFormSelect2 = document.querySelector(
    '[data-testid=facet2-form-select] > .ant-select-selector'
  ) as HTMLInputElement;
  expect(facetFormSelect2).toBeTruthy();
  fireEvent.mouseDown(facetFormSelect2);

  // Submit the form
  // NOTE: Submit button is outside of the form, so use click instead of submit
  fireEvent.click(facetFormBtn);
});

it('displays an error message with already applied constraints', async () => {
  const { getByRole, getByText } = render(<Facets {...defaultProps} />);

  // Submit the form
  const facetFormBtn = getByRole('button', { name: 'filter Apply Facets' });
  fireEvent.click(facetFormBtn);

  const errorMsgText = await waitFor(() =>
    getByText('Constraints already applied')
  );
  expect(errorMsgText).toBeTruthy();
});
