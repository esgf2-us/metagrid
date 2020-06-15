/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { render } from '@testing-library/react';

import Searches, { Props } from './Searches';

afterEach(() => {
  jest.clearAllMocks();
});

const defaultProps: Props = {
  savedSearches: [
    {
      id: 'id',
      project: { name: 'foo', facets_url: 'https://fubar.gov/?' },
      defaultFacets: { latest: true, replica: false },
      textInputs: ['foo'],
      activeFacets: { foo: ['option1', 'option2'], baz: ['option1'] },
      numResults: 1,
    },
  ],
  handleRemoveSearch: jest.fn(),
  handleApplySearch: jest.fn(),
};

it('renders component with empty savedSearches', () => {
  const { getByText } = render(
    <Searches {...defaultProps} savedSearches={[]} />
  );

  const emptyText = getByText('Your search library is empty');
  expect(emptyText).toBeTruthy();
});
