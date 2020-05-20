import React from 'react';
import { fireEvent, render, within } from '@testing-library/react';

import FacetsForm from './FacetsForm';

it('disables submit button when there are no selected facet options', () => {
  const availableFacets = {
    facet1: [
      ['foo', 3],
      ['bar', 5],
    ],
    facet2: [
      ['baz', 2],
      ['fubar', 3],
    ],
  };
  const { getByTestId, getByRole, getByText } = render(
    <FacetsForm
      activeFacets={{}}
      availableFacets={availableFacets}
      handleFacetsForm={jest.fn()}
    />
  );

  // Check Facetform component renders
  const facetsForm = getByTestId('facets-form');
  expect(facetsForm).toBeTruthy();

  // Open Collapse Panel in Collapse component for the facet1 form to render
  const collapse = getByText('Facet1');
  fireEvent.click(collapse);

  // Change the value of the Select (combobox) in order for the options to
  // render on the DOM.
  const facet1Form = getByTestId('facet1_form');
  const formField = within(facet1Form).getByRole('combobox');
  expect(formField).toBeTruthy();
  fireEvent.change(formField, { target: { value: 'foo' } });

  // Check submit button is initially disabled
  const submitBtn = within(facetsForm).getByTestId('button');
  expect(submitBtn.disabled).toBeTruthy();

  // Select the first facet option
  const facetOption = getByTestId('facet1_foo');
  expect(facetOption).toBeTruthy();
  fireEvent.click(facetOption);

  // Check submit button is enabled
  expect(submitBtn.disabled).toBeFalsy();

  // Remove the first facet option
  const removeOption = getByRole('img', { hidden: true, name: 'close' });
  expect(removeOption).toBeTruthy();
  fireEvent.click(removeOption);

  // Check button is disabled again
  expect(submitBtn.disabled).toBeTruthy();
});
