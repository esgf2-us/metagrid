/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { fireEvent, render, wait, within } from '@testing-library/react';

import Facets from './index';
import mockAxios from '../../__mocks__/axios';

const defaultProps = {
  activeProject: {},
  activeFacets: {},
  availableFacets: {
    facet1: [
      ['foo', 3],
      ['bar', 5],
    ],
    facet2: [
      ['baz', 2],
      ['fubar', 3],
    ],
  },
  handleProjectChange: jest.fn(),
  onSetActiveFacets: jest.fn(),
};

// Need to mock axios for projects
beforeEach(() => {
  const results = [{ name: 'test1' }, { name: 'test2' }];

  mockAxios.get.mockImplementationOnce(() =>
    Promise.resolve({
      data: {
        results,
      },
    })
  );
});

it('renders component', async () => {
  const { getByTestId } = render(<Facets {...defaultProps} />);

  // Check FacetsForm component renders
  const facetsForm = getByTestId('facets-form');
  await wait(() => expect(facetsForm).toBeTruthy());

  // Check ProjectForm component renders
  const projectForm = getByTestId('project-form');
  expect(projectForm).toBeTruthy();
});

it('handles when the project form is submitted with handleProjectsForm()', async () => {
  const { getByTestId } = render(<Facets {...defaultProps} />);

  // Check FacetsForm component renders
  const facetsForm = getByTestId('facets-form');
  await wait(() => expect(facetsForm).toBeTruthy());

  // Check ProjectForm component renders
  const projectForm = getByTestId('project-form');
  expect(projectForm).toBeTruthy();

  // Change the value of the Select component in order for the options to
  // render on the DOM
  const formField = within(projectForm).getByRole('combobox');
  fireEvent.change(formField, { target: { value: 'test1' } });
  expect(formField).toBeTruthy();

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

it('handles facets form submission with handleFacetsForm()', async () => {
  const { getByRole, getByTestId, getByText } = render(
    <Facets {...defaultProps} activeProject={{ name: 'test1' }} />
  );

  // Check FacetForm component renders
  const facetsForm = getByTestId('facets-form');
  await wait(() => expect(facetsForm).toBeTruthy());

  // Check ProjectForm component renders
  const projectForm = getByTestId('project-form');
  expect(projectForm).toBeTruthy();

  // Open Collapse Panel in Collapse component for the facet1 form to render
  const collapse = getByText('Facet1');
  fireEvent.click(collapse);

  // Change the value of the Select (combobox) in order for the options to
  // render on the DOM.
  const facet1Form = getByTestId('facet1_form');
  const formField = within(facet1Form).getByRole('combobox');
  expect(formField).toBeTruthy();
  fireEvent.change(formField, { target: { value: 'foo' } });

  // Select the first facet option
  const facetOption = getByTestId('facet1_foo');
  expect(facetOption).toBeTruthy();
  fireEvent.click(facetOption);

  // Submit the form
  // NOTE: Submit button is outside of the form, so use click instead of submit
  const facetFormBtn = getByRole('button', { name: 'filter Apply Facets' });
  fireEvent.click(facetFormBtn);
});

it('handles facets form submission with handleFacetsForm(), including a facet key that is undefined', async () => {
  const { getByRole, getByTestId, getByText } = render(
    <Facets {...defaultProps} activeProject={{ name: 'test1' }} />
  );

  // Check Facetform component renders
  const facetsForm = getByTestId('facets-form');
  await wait(() => expect(facetsForm).toBeTruthy());

  // Check ProjectForm component renders
  const projectForm = getByTestId('project-form');
  expect(projectForm).toBeTruthy();

  // Open Collapse Panel in Collapse component for the facet1 form to render
  const collapse = getByText('Facet1');
  fireEvent.click(collapse);

  // Change the value of the Select (combobox) in order for the options to
  // render on the DOM.
  const facet1Form = getByTestId('facet1_form');
  const formField = within(facet1Form).getByRole('combobox');
  expect(formField).toBeTruthy();
  fireEvent.change(formField, { target: { value: 'foo' } });

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

  // Click on the facet2 form but don't select an option
  // This will result in an undefined value for the form item (ant-design logic)
  const facet2Form = getByTestId('facet2_form');
  const formField2 = within(facet2Form).getByRole('combobox');
  fireEvent.click(formField2);

  // Submit the form
  // NOTE: Submit button is outside of the form, so use click instead of submit
  fireEvent.click(facetFormBtn);
});
