/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { fireEvent, render, waitFor, within } from '@testing-library/react';

import Search, {
  parseFacets,
  stringifyConstraints,
  checkConstraintsExist,
} from './index';
import mockAxios from '../../__mocks__/axios';

const defaultProps = {
  activeProject: { name: 'foo', facets_url: 'https://fubar.gov/?' },
  textInputs: ['foo'],
  activeFacets: { foo: ['option1', 'option2'], baz: ['option1'] },
  cart: [],
  onRemoveTag: jest.fn(),
  onClearTags: jest.fn(),
  onAddCart: jest.fn(),
  handleCart: jest.fn(),
  setAvailableFacets: jest.fn(),
};

// Reset all mocks after each test
afterEach(() => {
  jest.clearAllMocks();
});

describe('test Search component', () => {
  let data;
  beforeEach(() => {
    data = {
      response: {
        numFound: 2,
        docs: [
          {
            id: 'bar',
            url: undefined,
            number_of_files: 3,
            data_node: 'node.gov',
            version: 1,
            access: ['HTTPServer', 'GridFTP', 'OPENDAP', 'Globus'],
          },
          {
            id: 'bar',
            url: undefined,
            number_of_files: 2,
            data_node: 'node.gov',
            version: 1,
            access: ['HTTPServer', 'GridFTP', 'OPENDAP', 'Globus'],
          },
        ],
      },
      facet_counts: {
        facet_fields: {
          experiment: ['1950-Control', 38],
          science_driver: ['Water Cycle', 27],
          realm: ['atmos', 23],
          model_version: ['1_0', 38],
        },
      },
    };
  });

  it('renders component', async () => {
    mockAxios.get.mockImplementationOnce(() =>
      Promise.resolve({
        data,
      })
    );
    const { getByTestId } = render(<Search {...defaultProps} />);
    await waitFor(() => expect(getByTestId('search')).toBeTruthy());
  });

  it('renders Alert component if there is an error fetching results', async () => {
    const errorMessage = 'Network Error';
    mockAxios.get.mockImplementationOnce(() =>
      Promise.reject(new Error(errorMessage))
    );

    const { getByTestId } = render(<Search {...defaultProps} />);

    // Check if Alert component renders
    const alert = await waitFor(() => getByTestId('alert-fetching'));
    expect(alert).toBeTruthy();
  });

  it('runs the side effect to set the current url when there is an activeProject object with a facets_url key', async () => {
    mockAxios.get.mockImplementationOnce(() =>
      Promise.resolve({
        data,
      })
    );

    const { getByRole, getByTestId } = render(<Search {...defaultProps} />);

    // Wait for search to re-render
    await waitFor(() => getByTestId('search'));

    // Check if the 'Open as Json' button renders
    const jsonBtn = getByRole('img', { name: 'export' });
    expect(jsonBtn).toBeTruthy();
  });

  it('renders activeFacets and textInputs as stringified constraints', async () => {
    mockAxios.get.mockImplementationOnce(() =>
      Promise.resolve({
        data,
      })
    );

    const { getByRole, getByTestId } = render(
      <Search
        {...defaultProps}
        activeProject={{ name: 'foo', facets_url: 'https://fubar.gov/?' }}
      />
    );

    // Wait for search to re-render
    await waitFor(() => getByTestId('search'));

    // Check for stringified constraints text
    const strConstraints = getByRole('heading', {
      name:
        '2 results found for foo (Text Input = foo) AND (foo = option1 OR option2) AND (baz = option1)',
    });

    expect(strConstraints).toBeTruthy();
  });

  it('renders "No constraints applied" Alert when no constraints are applied', async () => {
    mockAxios.get.mockImplementationOnce(() =>
      Promise.resolve({
        data,
      })
    );

    const { getByText } = render(
      <Search {...defaultProps} activeFacets={{}} textInputs={[]} />
    );

    // Check if code string is generated from active facets
    const noConstraintsText = await waitFor(() =>
      getByText('No constraints applied')
    );
    expect(noConstraintsText).toBeTruthy();
  });

  it('clears all tags when selecting the "Clear All" tag', async () => {
    mockAxios.get.mockImplementationOnce(() =>
      Promise.resolve({
        data,
      })
    );

    const { getByText } = render(<Search {...defaultProps} />);

    // Check if 'Clear All' tag exists, then click it
    const clearAllTag = await waitFor(() => getByText('Clear All'));
    expect(clearAllTag).toBeTruthy();
    fireEvent.click(within(clearAllTag).getByRole('img', { name: 'close' }));
  });

  it('handles pagination and page size changes', async () => {
    // Update numFound to 20 in order to enable pagination buttons
    data = { ...data, response: { ...data.response, numFound: 20 } };

    mockAxios.get.mockImplementationOnce(() =>
      Promise.resolve({
        data,
      })
    );

    const { getByRole, getByTestId, getByText } = render(
      <Search {...defaultProps} />
    );

    // Wait for search to re-render
    await waitFor(() => getByTestId('search-table'));

    // Select the combobox drop down and update its value to render options
    const paginationList = getByRole('list');
    expect(paginationList).toBeTruthy();

    // Select the combobox drop down, update its value, then click it
    const pageSizeComboBox = within(paginationList).getByRole('combobox');
    expect(pageSizeComboBox).toBeTruthy();
    fireEvent.change(pageSizeComboBox, { target: { value: 'foo' } });
    fireEvent.click(pageSizeComboBox);

    // Wait for the options to render, then select 20 / page
    const secondOption = await waitFor(() => getByText('20 / page'));
    fireEvent.click(secondOption);

    // Change back to 10 / page
    const firstOption = await waitFor(() => getByText('10 / page'));
    fireEvent.click(firstOption);

    // Select the 'Next Page' button (only enabled if there are > 10 results)
    const nextPage = getByRole('listitem', { name: 'Next Page' });
    fireEvent.click(nextPage);
  });

  it('handles selecting a row"s checkbox in the table and adding to the cart', async () => {
    mockAxios.get.mockImplementationOnce(() =>
      Promise.resolve({
        data,
      })
    );

    const { getByRole, getByTestId } = render(<Search {...defaultProps} />);

    // Wait for search to re-render from side-effect
    await waitFor(() => getByTestId('search-table'));

    // Check the 'Add Selected to Cart' button is disabled
    const addCartBtn = getByRole('button', { name: 'Add Selected to Cart' });
    expect(addCartBtn).toBeTruthy();
    expect(addCartBtn.disabled).toBeTruthy();

    // Select the first row
    const firstRow = getByRole('row', {
      name: 'right-circle 3 node.gov 1 HTTPServer download plus',
    });
    expect(firstRow).toBeTruthy();

    // Select the first row's checkbox
    const firstCheckBox = within(firstRow).getByRole('checkbox');
    expect(firstCheckBox).toBeTruthy();
    fireEvent.click(firstCheckBox);

    // Check 'Add Selected to Cart' button is enabled and click it
    expect(addCartBtn.disabled).toBeFalsy();
    fireEvent.click(addCartBtn);
  });

  it('handles selecting a row"s checkbox in the table and adding to the cart', async () => {
    mockAxios.get.mockImplementationOnce(() =>
      Promise.resolve({
        data,
      })
    );

    const { getByRole, getAllByRole, getByTestId } = render(
      <Search {...defaultProps} />
    );

    // Wait for search to re-render
    await waitFor(() => getByTestId('search-table'));

    // Check the 'Add Selected to Cart' button is disabled
    const addCartBtn = getByRole('button', { name: 'Add Selected to Cart' });
    expect(addCartBtn).toBeTruthy();
    expect(addCartBtn.disabled).toBeTruthy();

    // TODO: Figure out a way to select all checkbox
    // Select the 'select all' checkbox
    const selectAllCheckbox = getAllByRole('cell', { name: '' })[0];
    fireEvent.click(selectAllCheckbox);

    // Check 'Add Selected to Cart' button is enabled and click it
    // expect(addCartBtn.disabled).toBeFalsy();
    // fireEvent.click(addCartBtn);
  });
});

describe('test parseFacets()', () => {
  it('successfully parses an object of arrays into an array of tuples', () => {
    const facets = {
      facet1: ['option1', 1, 'option2', 2],
      facet2: ['option1', 1, 'option2', 2],
    };

    const result = {
      facet1: [
        ['option1', 1],
        ['option2', 2],
      ],
      facet2: [
        ['option1', 1],
        ['option2', 2],
      ],
    };

    const parsedFacets = parseFacets(facets);
    expect(parsedFacets).toEqual(result);
  });
});

describe('test stringifyConstraints()', () => {
  let activeFacets;
  let textInputs;

  beforeEach(() => {
    activeFacets = {
      facet_1: ['option1', 'option2'],
      facet_2: ['option1', 'option2'],
    };
    textInputs = ['foo', 'bar'];
  });

  it('successfully generates a stringified version of the active constraints', () => {
    const strConstraints = stringifyConstraints(activeFacets, textInputs);
    expect(strConstraints).toEqual(
      '(Text Input = foo OR bar) AND (facet_1 = option1 OR option2) AND (facet_2 = option1 OR option2)'
    );
  });
  it('successfully generates a stringified version of the active constraints w/o textInputs', () => {
    const strConstraints = stringifyConstraints(activeFacets, []);
    expect(strConstraints).toEqual(
      '(facet_1 = option1 OR option2) AND (facet_2 = option1 OR option2)'
    );
  });
  it('successfully generates a stringified version of the active constraints w/o activeFacets', () => {
    const strConstraints = stringifyConstraints({}, textInputs);
    expect(strConstraints).toEqual('(Text Input = foo OR bar)');
  });
});

describe('test checkConstraintsExist()', () => {
  let activeFacets;
  let textInputs;

  beforeEach(() => {
    activeFacets = {
      facet_1: ['option1', 'option2'],
      facet_2: ['option1', 'option2'],
    };
    textInputs = ['foo', 'bar'];
  });

  it('returns true when activeFacets and textInputs exist', () => {
    const constraintsExist = checkConstraintsExist(activeFacets, textInputs);
    expect(constraintsExist).toBeTruthy();
  });
  it('returns true when only textInputs exist', () => {
    const constraintsExist = checkConstraintsExist({}, textInputs);
    expect(constraintsExist).toBeTruthy();
  });

  it('returns true when only activeFacets exist', () => {
    const constraintsExist = checkConstraintsExist(activeFacets, []);
    expect(constraintsExist).toBeTruthy();
  });

  it('returns false if constraints do not exist', () => {
    const constraintsExist = checkConstraintsExist({}, []);
    expect(constraintsExist).toBeFalsy();
  });
});
