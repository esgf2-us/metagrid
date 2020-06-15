/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { fireEvent, render, waitFor } from '@testing-library/react';

import Cart, { Props } from './index';
import mockAxios from '../../__mocks__/axios';

// API return data
const data = { response: { numFound: 1 } };

const defaultProps: Props = {
  cart: [
    {
      id: 'foo',
      url: ['foo.bar'],
      number_of_files: 3,
      data_node: 'node.gov',
      version: 1,
      size: 1,
      access: ['HTTPServer', 'GridFTP', 'OPENDAP', 'Globus'],
    },
    {
      id: 'bar',
      url: ['foo.bar'],
      number_of_files: 2,
      data_node: 'node.gov',
      version: 1,
      size: 1,
      access: ['HTTPServer', 'GridFTP', 'OPENDAP', 'Globus'],
    },
  ],
  savedSearches: [
    {
      id: 'id',
      project: { name: 'foo', facets_url: 'https://fubar.gov/?' },
      defaultFacets: { latest: true, replica: false },
      activeFacets: { foo: ['option1', 'option2'], baz: ['option1'] },
      textInputs: ['foo'],
      numResults: 1,
    },
  ],
  handleCart: jest.fn(),
  clearCart: jest.fn(),
  handleRemoveSearch: jest.fn(),
  handleApplySearch: jest.fn(),
};

let mockHistoryPush: () => void;
beforeEach(() => {
  mockHistoryPush = jest.fn();
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

afterEach(() => {
  jest.clearAllMocks();
});

it('handles tab switching and saved search actions', async () => {
  mockAxios.get.mockImplementationOnce(() =>
    Promise.resolve({
      data,
    })
  );

  const { getByRole, getByTestId } = render(
    <MemoryRouter>
      <Cart {...defaultProps} />
    </MemoryRouter>
  );

  // Check cart tab renders
  const cart = await waitFor(() => getByTestId('cart'));
  expect(cart).toBeTruthy();

  // Check Search Criteria Tab renders and click it
  const searchCriteriaTab = await waitFor(() =>
    getByRole('tab', {
      name: 'book Search Criteria',
      hidden: true,
    })
  );
  expect(searchCriteriaTab).toBeTruthy();
  fireEvent.click(searchCriteriaTab);

  // Check JSON link renders and click it
  const jsonLink = await waitFor(() => getByRole('link'));
  expect(jsonLink).toBeTruthy();
  fireEvent.click(jsonLink);

  // Wait for cart to re-render
  await waitFor(() => getByTestId('cart'));

  // Check apply search button renders and click it
  const applyBtn = await waitFor(() =>
    getByRole('img', { name: 'search', hidden: true })
  );
  expect(applyBtn).toBeTruthy();
  fireEvent.click(applyBtn);

  // Wait for cart to re-render
  await waitFor(() => getByTestId('cart'));

  // Check delete button renders and click it
  const deleteBtn = await waitFor(() =>
    getByRole('img', { name: 'delete', hidden: true })
  );
  expect(deleteBtn).toBeTruthy();
  fireEvent.click(deleteBtn);
});
