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
  onSetFacets: jest.fn(),
};

describe('test FacetsForm component', () => {
  it('handles submitting filename', async () => {
    const { getByRole } = render(<FacetsForm {...defaultProps} />);

    // Change form field values
    const input = getByRole('textbox', {
      name: 'Filename Variable question-circle',
    }) as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'var' } });
    expect(input.value).toEqual('var');

    // Submit the form
    const submitBtn = getByRole('img', { name: 'search' });
    fireEvent.submit(submitBtn);

    // Check if the input value resets back to blank
    await waitFor(() => expect(input.value).toEqual(''));
  });
});
