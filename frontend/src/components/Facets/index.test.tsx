import { fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import {
  activeSearchQueryFixture,
  parsedFacetsFixture,
  parsedNodeStatusFixture,
} from '../../api/mock/fixtures';
import Facets, { Props } from './index';
import { customRender } from '../../test/custom-render';

const user = userEvent.setup();

const defaultProps: Props = {
  activeSearchQuery: activeSearchQueryFixture(),
  availableFacets: parsedFacetsFixture(),
  nodeStatus: parsedNodeStatusFixture(),
  onProjectChange: jest.fn(),
  onSetFilenameVars: jest.fn(),
  onSetGeneralFacets: jest.fn(),
  onSetActiveFacets: jest.fn(),
};

it('renders component', async () => {
  const { getByTestId } = customRender(<Facets {...defaultProps} />);

  // Check FacetsForm component renders
  const facetsForm = await waitFor(() => getByTestId('facets-form'));
  await waitFor(() => expect(facetsForm).toBeTruthy());

  // Check ProjectForm component renders
  const projectForm = await waitFor(() => getByTestId('project-form'));
  expect(projectForm).toBeTruthy();
});

xit('handles when the project form is submitted', async () => {
  const { getByTestId } = customRender(
    <Facets
      {...defaultProps}
      activeSearchQuery={{ ...activeSearchQueryFixture(), project: {} }}
    />
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

  // Select the second project option
  const projectOption = getByTestId('project_1');
  expect(projectOption).toBeTruthy();
  await user.click(projectOption);

  // Wait for facet form component to re-render
  await waitFor(() => getByTestId('facets-form'));

  // Submit the form
  // NOTE: Submit button is inside the form, so use submit
  const projectFormBtn = within(projectForm).getByRole('img', {
    name: 'select',
  });
  fireEvent.submit(projectFormBtn);
});

it('handles facets form auto-filtering', async () => {
  const { getByTestId, getByText, getByRole } = customRender(
    <Facets {...defaultProps} />
  );

  // Check ProjectForm component renders
  const projectForm = await waitFor(() => getByTestId('project-form'));
  expect(projectForm).toBeTruthy();

  // Check FacetsForm component renders
  const facetsForm = await waitFor(() => getByTestId('facets-form'));
  await waitFor(() => expect(facetsForm).toBeTruthy());

  // Open top collapse panel
  const group1Panel = within(facetsForm).getByRole('button', {
    name: 'right Group1',
  });
  await user.click(group1Panel);

  // Open Collapse Panel in Collapse component for the data_node form to render
  const collapse = getByText('Data Node');
  await user.click(collapse);

  // Check facet select form exists and mouseDown to expand list of options
  const facetFormSelect = document.querySelector(
    '[data-testid=data_node-form-select] > .ant-select-selector'
  ) as HTMLInputElement;
  expect(facetFormSelect).toBeTruthy();
  fireEvent.mouseDown(facetFormSelect);

  // Select the first facet option
  const facetOption = getByTestId('data_node_aims3.llnl.gov');
  expect(facetOption).toBeTruthy();
  await user.click(facetOption);

  // Wait for facet form component to re-render
  await waitFor(() => getByTestId('facets-form'));

  // De-select the first facet option
  const closeFacetOption = getByRole('img', {
    name: 'close',
    hidden: true,
  });
  await user.click(closeFacetOption);

  // Wait for facet form component to re-render
  await waitFor(() => getByTestId('facets-form'));
});

it('handles facets form submission, including a facet key that is undefined', async () => {
  const { getByTestId, getByText, getByRole } = customRender(
    <Facets {...defaultProps} />
  );

  // Check FacetsForm component renders
  const facetsForm = await waitFor(() => getByTestId('facets-form'));
  await waitFor(() => expect(facetsForm).toBeTruthy());

  // Check ProjectForm component renders
  const projectForm = await waitFor(() => getByTestId('project-form'));
  expect(projectForm).toBeTruthy();

  // Open top collapse panel
  const group1Panel = within(facetsForm).getByRole('button', {
    name: 'right Group1',
  });
  await user.click(group1Panel);

  // Open Collapse Panel in Collapse component for the Data Node form to render
  const collapse = getByText('Data Node');
  await user.click(collapse);

  // Check facet select form exists and mouseDown to expand list of options
  const facetFormSelect = document.querySelector(
    '[data-testid=data_node-form-select] > .ant-select-selector'
  ) as HTMLInputElement;
  expect(facetFormSelect).toBeTruthy();
  fireEvent.mouseDown(facetFormSelect);

  // Select the first facet option
  const facetOption = getByTestId('data_node_aims3.llnl.gov');
  expect(facetOption).toBeTruthy();
  await user.click(facetOption);

  // Wait for facet form component to re-render
  await waitFor(() => getByTestId('facets-form'));

  // Open Collapse Panel for  in Collapse component for the facet2 form to render
  // Open additional properties collapse panel
  const collapse2 = getByRole('button', {
    name: 'right Group2',
  });
  await user.click(collapse2);

  // Click on the facet2 select form but don't select an option
  // This will result in an undefined value for the form item (ant-design logic)
  // Check facet select form exists and mouseDown to expand list of options
  const facetFormSelect2 = document.querySelector(
    '[data-testid=facet2-form-select] > .ant-select-selector'
  ) as HTMLInputElement;
  expect(facetFormSelect2).toBeTruthy();
  fireEvent.mouseDown(facetFormSelect2);

  // Wait for facet form component to re-render
  await waitFor(() => getByTestId('facets-form'));
});
