/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { fireEvent, render, waitFor } from '@testing-library/react';

import SearchesCard, { Props } from './SearchesCard';
import mockAxios from '../../__mocks__/axios';

// API return data
const data = { response: { numFound: 1 } };

const defaultProps: Props = {
  savedSearch: {
    id: 'id',
    project: { name: 'foo', facets_url: 'https://fubar.gov/?' },
    textInputs: ['foo'],
    activeFacets: { foo: ['option1', 'option2'], baz: ['option1'] },
    numResults: 1,
  },
  index: 0,
  handleRemoveSearch: jest.fn(),
  handleApplySearch: jest.fn(),
};

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

it('renders component and handles button clicks', async () => {
  mockAxios.get.mockImplementationOnce(() =>
    Promise.resolve({
      data,
    })
  );

  const { getByRole } = render(
    <MemoryRouter>
      <SearchesCard {...defaultProps} />
    </MemoryRouter>
  );

  // Check search button renders and click it
  const searchBtn = await waitFor(() => getByRole('img', { name: 'search' }));
  expect(searchBtn).toBeTruthy();
  fireEvent.click(searchBtn);

  // Check delete button renders and click it
  const deleteBtn = getByRole('img', { name: 'delete' });
  expect(deleteBtn).toBeTruthy();
  fireEvent.click(deleteBtn);
});

it('displays "N/A" when no constraints are applied', async () => {
  mockAxios.get.mockImplementationOnce(() =>
    Promise.resolve({
      data,
    })
  );

  const { getByText } = render(
    <SearchesCard
      {...defaultProps}
      savedSearch={{
        ...defaultProps.savedSearch,
        activeFacets: {},
        textInputs: [],
      }}
    />
  );

  // Check search button renders
  const queryString = await waitFor(() => getByText('N/A'));
  expect(queryString).toBeTruthy();
});
