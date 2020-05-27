import React from 'react';
import { fireEvent, render } from '@testing-library/react';

import FacetsForm from './FacetsForm';

it('disables submit button when there are no selected facet options', () => {
  const availableFacets: { [key: string]: [string, number][] } = {
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

  // Check facet select form exists and mouseDown to expand list of options
  const facetFormSelect = document.querySelector(
    '[data-testid=facet1-form-select] > .ant-select-selector'
  ) as HTMLInputElement;
  expect(facetFormSelect).toBeTruthy();
  fireEvent.mouseDown(facetFormSelect);

  // Check submit button is initially disabled
  const submitBtn = getByRole('button', {
    name: 'filter Apply Facets',
  }) as HTMLInputElement;
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
