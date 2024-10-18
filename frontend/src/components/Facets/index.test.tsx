import { act, fireEvent, within, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import {
  activeSearchQueryFixture,
  parsedFacetsFixture,
  parsedNodeStatusFixture,
} from '../../test/mock/fixtures';
import Facets, { Props } from './index';
import customRender from '../../test/custom-render';

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
  customRender(<Facets {...defaultProps} />);

  // Check FacetsForm component renders
  const facetsForm = await screen.findByTestId('facets-form');
  expect(facetsForm).toBeTruthy();

  // Check ProjectForm component renders
  const projectForm = await screen.findByTestId('project-form');
  expect(projectForm).toBeTruthy();
});

it('handles facets form auto-filtering', async () => {
  customRender(<Facets {...defaultProps} />);

  // Check ProjectForm component renders
  const projectForm = await screen.findByTestId('project-form');
  expect(projectForm).toBeTruthy();

  // Check FacetsForm component renders
  const facetsForm = await screen.findByTestId('facets-form');
  expect(facetsForm).toBeTruthy();

  // Open top collapse panel
  const group1Panel = await within(facetsForm).findByRole('button', {
    name: 'collapsed Group1',
  });

  await act(async () => {
    await user.click(group1Panel);
  });

  // Open Collapse Panel in Collapse component for the data_node form to render
  const collapse = await screen.findByText('Data Node');

  await act(async () => {
    await user.click(collapse);
  });

  // Check facet select form exists and mouseDown to expand list of options
  const facetFormSelect = document.querySelector(
    '[data-testid=data_node-form-select] > .ant-select-selector'
  ) as HTMLInputElement;
  expect(facetFormSelect).toBeTruthy();
  fireEvent.mouseDown(facetFormSelect);

  // Select the first facet option
  const facetOption = await screen.findByTestId('data_node_aims3.llnl.gov');
  expect(facetOption).toBeTruthy();

  await act(async () => {
    await user.click(facetOption);
  });

  // Wait for facet form component to re-render
  await screen.findByTestId('facets-form');

  // De-select the first facet option
  const closeFacetOption = await screen.findByRole('img', {
    name: 'close',
    hidden: true,
  });

  await act(async () => {
    await user.click(closeFacetOption);
  });

  // Wait for facet form component to re-render
  await screen.findByTestId('facets-form');
});

it('handles facets form submission, including a facet key that is undefined', async () => {
  customRender(<Facets {...defaultProps} />);

  // Check FacetsForm component renders
  const facetsForm = await screen.findByTestId('facets-form');
  expect(facetsForm).toBeTruthy();

  // Check ProjectForm component renders
  const projectForm = await screen.findByTestId('project-form');
  expect(projectForm).toBeTruthy();

  // Open top collapse panel
  const group1Panel = within(facetsForm).getByRole('button', {
    name: 'collapsed Group1',
  });

  await act(async () => {
    await user.click(group1Panel);
  });

  // Open Collapse Panel in Collapse component for the Data Node form to render
  const collapse = await screen.findByText('Data Node');

  await act(async () => {
    await user.click(collapse);
  });

  // Check facet select form exists and mouseDown to expand list of options
  const facetFormSelect = document.querySelector(
    '[data-testid=data_node-form-select] > .ant-select-selector'
  ) as HTMLInputElement;
  expect(facetFormSelect).toBeTruthy();
  fireEvent.mouseDown(facetFormSelect);

  // Select the first facet option
  const facetOption = await screen.findByTestId('data_node_aims3.llnl.gov');
  expect(facetOption).toBeTruthy();

  await act(async () => {
    await user.click(facetOption);
  });

  // Wait for facet form component to re-render
  await screen.findByTestId('facets-form');

  // Open Collapse Panel for  in Collapse component for the facet2 form to render
  // Open additional properties collapse panel
  const collapse2 = await screen.findByRole('button', {
    name: 'collapsed Group2',
  });

  await act(async () => {
    await user.click(collapse2);
  });

  // Click on the facet2 select form but don't select an option
  // This will result in an undefined value for the form item (ant-design logic)
  // Check facet select form exists and mouseDown to expand list of options
  const facetFormSelect2 = document.querySelector(
    '[data-testid=facet2-form-select] > .ant-select-selector'
  ) as HTMLInputElement;
  expect(facetFormSelect2).toBeTruthy();
  fireEvent.mouseDown(facetFormSelect2);

  // Wait for facet form component to re-render
  await screen.findByTestId('facets-form');
});
