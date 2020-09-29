import { fireEvent, render, waitFor, within } from '@testing-library/react';
import React from 'react';
import {
  defaultFacetsFixture,
  parsedFacetsFixture,
  rawProjectFixture,
} from '../../api/mock/fixtures';
import Facets, { Props } from './index';

const defaultProps: Props = {
  activeProject: rawProjectFixture(),
  defaultFacets: defaultFacetsFixture(),
  activeFacets: {},
  projectFacets: parsedFacetsFixture(),
  onProjectChange: jest.fn(),
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
  const { getByTestId } = render(
    <Facets {...defaultProps} activeProject={{}} />
  );

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

it('handles facets form auto-filtering', async () => {
  const { getByTestId, getByText, getByRole } = render(
    <Facets {...defaultProps} />
  );

  // Check ProjectForm component renders
  const projectForm = await waitFor(() => getByTestId('project-form'));
  expect(projectForm).toBeTruthy();

  // Check FacetsForm component renders
  const facetsForm = await waitFor(() => getByTestId('facets-form'));
  await waitFor(() => expect(facetsForm).toBeTruthy());

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

  // Wait for facet form component to re-render
  await waitFor(() => getByTestId('facets-form'));

  // De-select the first facet option
  const closeFacetOption = getByRole('img', {
    name: 'close',
    hidden: true,
  });
  fireEvent.click(closeFacetOption);
  // Wait for facet form component to re-render
  await waitFor(() => getByTestId('facets-form'));
});

it('handles facets form submission, including a facet key that is undefined', async () => {
  const { getByTestId, getByText } = render(<Facets {...defaultProps} />);

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
});
