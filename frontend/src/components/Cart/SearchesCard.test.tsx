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
    defaultFacets: { latest: true, replica: false },
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
      } as Record<string, unknown>)
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

it('displays alert error when api fails to return response', async () => {
  mockAxios.get.mockImplementationOnce(() =>
    Promise.reject(new Error('Network Error'))
  );

  const { getByRole } = render(<SearchesCard {...defaultProps} />);

  // Check alert renders
  const alert = await waitFor(() => getByRole('img', { name: 'close-circle' }));
  expect(alert).toBeTruthy();
});
