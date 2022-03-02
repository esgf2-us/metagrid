import { fireEvent, render, waitFor } from '@testing-library/react';
import React from 'react';
import {
  activeSearchQueryFixture,
  parsedFacetsFixture,
  parsedNodeStatusFixture,
} from '../../api/mock/fixtures';
import FacetsForm, { humanizeFacetNames, Props } from './FacetsForm';

describe('Test humanizeFacetNames', () => {
  it('removes underscore and lowercases', () => {
    expect(humanizeFacetNames('camel_case')).toEqual('Camel Case');
  });

  it('does not change properly formatted text ', () => {
    expect(humanizeFacetNames('Proper Text')).toEqual('Proper Text');
  });

  it('converts acronyms to uppercase', () => {
    expect(humanizeFacetNames('facet_id')).toEqual('Facet ID');
  });
});

const defaultProps: Props = {
  activeSearchQuery: activeSearchQueryFixture(),
  availableFacets: parsedFacetsFixture(),
  nodeStatus: parsedNodeStatusFixture(),
  onSetFilenameVars: jest.fn(),
  onSetGeneralFacets: jest.fn(),
  onSetActiveFacets: jest.fn(),
};

describe('test FacetsForm component', () => {
  it('handles submitting filename', async () => {
    const { getByRole, getByTestId } = render(<FacetsForm {...defaultProps} />);

    // Open filename collapse panel
    const filenameSearchPanel = getByRole('button', {
      name: 'right Filename',
    });
    fireEvent.click(filenameSearchPanel);

    // Change form field values
    const input = getByTestId('filename-search-input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'var' } });
    expect(input.value).toEqual('var');

    // Submit the form
    const submitBtn = getByRole('img', { name: 'search' });
    fireEvent.submit(submitBtn);

    // Check if the input value resets back to blank
    await waitFor(() => expect(input.value).toEqual(''));
  });

  it('handles date picker for versioning', async () => {
    const { getByTestId, getByRole } = render(<FacetsForm {...defaultProps} />);

    // Open additional properties collapse panel
    const additionalPropertiesPanel = getByRole('button', {
      name: 'right Additional Properties',
    });
    fireEvent.click(additionalPropertiesPanel);

    // Check date picker renders
    const datePickerComponent = getByTestId('version-range-datepicker');
    expect(datePickerComponent).toBeTruthy();

    const datePickerComponentInput =
      datePickerComponent.querySelectorAll('input')[0];

    // Open calendar and focus on input
    fireEvent.mouseDown(datePickerComponentInput);

    // Set date as input value
    fireEvent.change(datePickerComponentInput, {
      target: { value: '2020-01-15' },
    });

    // Open calendar, select the set value, and click it
    fireEvent.click(
      document.querySelector('.ant-picker-cell-selected') as HTMLInputElement
    );

    await waitFor(() => getByTestId('facets-form'));
  });
});
