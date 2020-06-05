/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { fireEvent, render } from '@testing-library/react';

import { MemoryRouter } from 'react-router-dom';
import Searches, { Props } from './Searches';

beforeEach(() => {
  const mockHistoryPush = jest.fn();
  jest.mock(
    'react-router-dom',
    () =>
      ({
        ...jest.requireActual('react-router-dom'),
        useHistory: () => ({
          push: mockHistoryPush,
        }),
      } as {})
  );
});

afterEach(() => {
  jest.clearAllMocks();
});

const defaultProps: Props = {
  savedSearches: [
    {
      id: 'id',
      project: { name: 'foo', facets_url: 'https://fubar.gov/?' },
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

it('renders component with savedSearches and handles button clicks', () => {
  const { getByRole } = render(
    <MemoryRouter>
      <Searches {...defaultProps} />
    </MemoryRouter>
  );

  // Check search button renders and click it
  const searchBtn = getByRole('img', { name: 'search' });
  expect(searchBtn).toBeTruthy();
  fireEvent.click(searchBtn);

  // Check delete button renders and click it
  const deleteBtn = getByRole('img', { name: 'delete' });
  expect(deleteBtn).toBeTruthy();
  fireEvent.click(deleteBtn);
});

it('displays "N/A" when no constraints are applied', () => {
  const { getByText } = render(
    <Searches
      {...defaultProps}
      savedSearches={[
        {
          ...defaultProps.savedSearches[0],
          activeFacets: {},
          textInputs: [],
        },
      ]}
    />
  );

  // Check search button renders
  const queryString = getByText('N/A');
  expect(queryString).toBeTruthy();
});
