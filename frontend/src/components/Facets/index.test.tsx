import { fireEvent, within, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import Facets from './index';
import customRender from '../../test/custom-render';
import { activeSearch } from '../../test/jestTestFunctions';
import App from '../App/App';

const user = userEvent.setup();

it('renders component', async () => {
  customRender(<Facets />);

  // Check FacetsForm component renders
  const facetsForm = await screen.findByTestId('facets-form');
  expect(facetsForm).toBeTruthy();

  // Check ProjectForm component renders
  const projectForm = await screen.findByTestId('project-form');
  expect(projectForm).toBeTruthy();
});

it('handles facets form auto-filtering', async () => {
  customRender(<Facets />, {
    usesAtoms: true,
  });

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

  await user.click(group1Panel);

  // Open Collapse Panel in Collapse component for the data_node form to render
  const collapse = await screen.findByText('Data Node');

  await user.click(collapse);

  // Check facet select form exists and mouseDown to expand list of options
  const facetFormSelect = document.querySelector(
    '[data-testid=data_node-form-select] > .ant-select-selector'
  ) as HTMLInputElement;
  expect(facetFormSelect).toBeTruthy();
  fireEvent.mouseDown(facetFormSelect);

  // Select the first facet option
  const facetOption = await screen.findByTestId('data_node_aims3.llnl.gov');
  expect(facetOption).toBeTruthy();

  await user.click(facetOption);

  // Wait for facet form component to re-render
  await screen.findByTestId('facets-form');

  // De-select the first facet option
  const closeFacetOption = await screen.findByRole('img', {
    name: 'close',
    hidden: true,
  });

  await user.click(closeFacetOption);

  // Wait for facet form component to re-render
  await screen.findByTestId('facets-form');
});

it('handles facets form submission, including a facet key that is undefined', async () => {
  customRender(<Facets />, {
    usesAtoms: true,
  });

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

  await user.click(group1Panel);

  // Open Collapse Panel in Collapse component for the Data Node form to render
  const collapse = await screen.findByText('Data Node');

  await user.click(collapse);

  // Check facet select form exists and mouseDown to expand list of options
  const facetFormSelect = document.querySelector(
    '[data-testid=data_node-form-select] > .ant-select-selector'
  ) as HTMLInputElement;
  expect(facetFormSelect).toBeTruthy();
  fireEvent.mouseDown(facetFormSelect);

  // Select the first facet option
  const facetOption = await screen.findByTestId('data_node_aims3.llnl.gov');
  expect(facetOption).toBeTruthy();

  await user.click(facetOption);

  // Wait for facet form component to re-render
  await screen.findByTestId('facets-form');

  // Open Collapse Panel for  in Collapse component for the facet2 form to render
  // Open additional properties collapse panel
  const collapse2 = await screen.findByRole('button', {
    name: 'collapsed Group2',
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
  await screen.findByTestId('facets-form');
});

it('handles project change when selectedProject.pk !== activeSearchQuery.project.pk', async () => {
  customRender(<App searchQuery={activeSearch} />, {
    usesAtoms: true,
  });

  // Wait for components to rerender
  await screen.findByTestId('main-query-string-label');

  // Check FacetsForm component renders
  const facetsForm = await screen.findByTestId('search-facets');
  expect(facetsForm).toBeTruthy();

  // Expect the current selected project to be test1
  const test1 = await within(facetsForm).findByText('test1 Data Info');
  expect(test1).toBeTruthy();

  // Open the project dropdown
  const option1 = await within(facetsForm).findByText('test1');
  await user.click(option1);

  // Click the test2 ptoject from the dropdown
  await user.click(await screen.findByTitle('test2'));

  // Expect the current selected project to now be test2
  const test2 = await within(facetsForm).findByText('test2 Data Info');
  expect(test2).toBeTruthy();
});
