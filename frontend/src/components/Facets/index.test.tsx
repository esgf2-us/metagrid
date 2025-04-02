import { fireEvent, within, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import Facets from './index';
import customRender from '../../test/custom-render';
import { RecoilRoot } from 'recoil';
import { useRecoilState } from 'recoil';
import { activeSearchQueryAtom, projectBaseQuery } from '../App/recoil/atoms';
import { RawProject } from './types';
import { rawProjectFixture } from '../../test/mock/fixtures';
import { RecoilWrapper } from '../../test/jestTestFunctions';

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
    usesRecoil: true,
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
    usesRecoil: true,
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
  const initialProject: RawProject = rawProjectFixture({
    pk: '2',
    name: 'Project2',
    projectUrl: '',
  });
  RecoilWrapper.modifyAtomValue(activeSearchQueryAtom.key, {
    project: initialProject,
  });
  customRender(<Facets />, {
    usesRecoil: true,
  });

  // Check FacetsForm component renders
  const facetsForm = await screen.findByTestId('facets-form');
  expect(facetsForm).toBeTruthy();

  // Check ProjectForm component renders
  const projectForm = await screen.findByTestId('project-form');
  expect(projectForm).toBeTruthy();

  // Open the project dropdown
  const projectDropDown = (await screen.findAllByRole('combobox'))[0];
  expect(projectDropDown).toBeTruthy();
  fireEvent.mouseDown(projectDropDown);

  // Select the 2nd project in the drop-down
  const option2 = await screen.findByRole('option', {
    name: 'test2',
  });
  await user.click(option2);
});
