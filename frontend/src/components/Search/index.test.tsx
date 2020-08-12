/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { fireEvent, render, waitFor, within } from '@testing-library/react';

import Search, {
  parseFacets,
  stringifyConstraints,
  checkConstraintsExist,
  Props,
} from './index';
import apiRoutes from '../../api/routes';
import { proxyString, nodeProtocol, nodeUrl } from '../../env';
import {
  defaultFacetsFixture,
  esgSearchApiFixture,
  searchResultFixture,
} from '../../api/mock/fixtures';
import { server, rest } from '../../api/mock/setup-env';

const defaultProps: Props = {
  activeProject: { name: 'foo', facetsUrl: 'https://fubar.gov/?' },
  defaultFacets: defaultFacetsFixture(),
  activeFacets: { foo: ['option1', 'option2'], baz: ['option1'] },
  textInputs: ['foo'],
  cart: [],
  onRemoveTag: jest.fn(),
  onClearTags: jest.fn(),
  handleCart: jest.fn(),
  setAvailableFacets: jest.fn(),
  handleSaveSearch: jest.fn(),
};

// Reset all mocks after each test
afterEach(() => {
  jest.clearAllMocks();
});

describe('test Search component', () => {
  it('renders component', async () => {
    const { getByTestId } = render(<Search {...defaultProps} />);

    // Check search component renders
    const searchComponent = await waitFor(() => getByTestId('search'));
    expect(searchComponent).toBeTruthy();

    // Check search table renders
    const searchTable = await waitFor(() => getByTestId('search-table'));
    expect(searchTable).toBeTruthy();
  });

  it('renders Alert component if there is an error fetching results', async () => {
    server.use(
      // ESGF Search API - datasets
      rest.get(
        `${proxyString}/${nodeProtocol}${nodeUrl}/esg-search/search/`,
        (_req, res, ctx) => {
          return res(ctx.status(404));
        }
      )
    );

    const { getByTestId } = render(<Search {...defaultProps} />);

    // Check if Alert component renders
    const alert = await waitFor(() => getByTestId('alert-fetching'));
    expect(alert).toBeTruthy();
  });

  it('runs the side effect to set the current url when there is an activeProject object with a facetsUrl key', async () => {
    const { getByRole, getByTestId } = render(<Search {...defaultProps} />);

    // Check search component renders
    const searchComponent = await waitFor(() => getByTestId('search'));
    expect(searchComponent).toBeTruthy();

    // Check if the 'Open as Json' button renders
    const jsonBtn = await waitFor(() => getByRole('img', { name: 'export' }));
    expect(jsonBtn).toBeTruthy();
  });

  it('renders activeFacets and textInputs as stringified constraints', async () => {
    const { getByRole, getByTestId } = render(<Search {...defaultProps} />);

    // Check search component renders
    const searchComponent = await waitFor(() => getByTestId('search'));
    expect(searchComponent).toBeTruthy();

    // Check for stringified constraints text
    const strConstraints = await waitFor(() =>
      getByRole('heading', {
        name:
          '2 results found for foo (latest = true) AND (replica = false) AND (Text Input = foo) AND (foo = option1 OR option2) AND (baz = option1)',
      })
    );

    expect(strConstraints).toBeTruthy();
  });

  it('renders "No project constraints applied" Alert when no constraints are applied', async () => {
    const { getByText, getByTestId } = render(
      <Search {...defaultProps} activeFacets={{}} textInputs={[]} />
    );

    // Check search component renders
    const searchComponent = await waitFor(() => getByTestId('search'));
    expect(searchComponent).toBeTruthy();

    // Check if code string is generated from active facets
    const noConstraintsText = await waitFor(() =>
      getByText('No project constraints applied')
    );
    expect(noConstraintsText).toBeTruthy();
  });

  it('clears all tags when selecting the "Clear All" tag', async () => {
    const { getByText, getByTestId } = render(<Search {...defaultProps} />);

    // Check search component renders
    const searchComponent = await waitFor(() => getByTestId('search'));
    expect(searchComponent).toBeTruthy();

    // Check if 'Clear All' tag exists, then click it
    const clearAllTag = await waitFor(() => getByText('Clear All'));
    expect(clearAllTag).toBeTruthy();

    // Check close button inside clear all tag exiss
    const clearBtn = await waitFor(() =>
      within(clearAllTag).getByRole('img', { name: 'close' })
    );
    expect(clearBtn).toBeTruthy();
    fireEvent.click(clearBtn);

    // Wait for search component to re-render
    await waitFor(() => getByTestId('search'));
  });

  it('handles pagination and page size changes', async () => {
    // Update api to return 20 search results, which enables pagination if 10/page selected
    const data = esgSearchApiFixture();
    server.use(
      rest.get(apiRoutes.esgfDatasets, (_req, res, ctx) => {
        return res(
          ctx.status(200),
          ctx.json({
            ...data,
            response: {
              docs: new Array(20).fill(
                searchResultFixture()
              ) as RawSearchResult[],
              numFound: 20,
            },
          })
        );
      })
    );

    const { getByRole, getByTestId, getByText } = render(
      <Search {...defaultProps} />
    );

    // Check search component renders
    const searchComponent = await waitFor(() => getByTestId('search'));
    expect(searchComponent).toBeTruthy();

    // Wait for search to re-render
    await waitFor(() => getByTestId('search-table'));

    // Select the combobox drop down and update its value to render options
    const paginationList = await waitFor(() => getByRole('list'));
    expect(paginationList).toBeTruthy();

    // Select the combobox drop down, update its value, then click it
    const pageSizeComboBox = await waitFor(() =>
      within(paginationList).getByRole('combobox')
    );
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
    const nextPage = await waitFor(() =>
      getByRole('listitem', { name: 'Next Page' })
    );
    fireEvent.click(nextPage);

    // Wait for search table to re-render
    await waitFor(() => getByTestId('search-table'));
  });

  it('handles selecting a row"s checkbox in the table and adding to the cart', async () => {
    const { getByRole, getByTestId } = render(<Search {...defaultProps} />);

    // Check search component renders
    const searchComponent = await waitFor(() => getByTestId('search'));
    expect(searchComponent).toBeTruthy();

    // Wait for search to re-render from side-effect
    await waitFor(() => getByTestId('search-table'));

    // Check the 'Add Selected to Cart' button is disabled
    const addCartBtn = (await waitFor(() =>
      getByRole('button', {
        name: 'shopping-cart Add Selected to Cart',
      })
    )) as HTMLButtonElement;
    expect(addCartBtn).toBeTruthy();
    expect(addCartBtn.disabled).toBeTruthy();

    // Select the first row
    const firstRow = getByRole('row', {
      name:
        'right-circle foo 3 1 Bytes node.gov 1 check-circle Globus Compatible wget download plus',
    });
    expect(firstRow).toBeTruthy();

    // Select the first row's checkbox
    const firstCheckBox = within(firstRow).getByRole('checkbox');
    expect(firstCheckBox).toBeTruthy();
    fireEvent.click(firstCheckBox);

    // Check 'Add Selected to Cart' button is enabled and click it
    expect(addCartBtn.disabled).toBeFalsy();
    fireEvent.click(addCartBtn);

    // Wait for search component to re-render
    await waitFor(() => getByTestId('search'));
  });

  it('disables the "Add Selected to Cart" button when no items are in the cart', async () => {
    const { getByRole, getByTestId } = render(<Search {...defaultProps} />);

    // Check search component renders
    const searchComponent = await waitFor(() => getByTestId('search'));
    expect(searchComponent).toBeTruthy();

    // Wait for search to re-render
    await waitFor(() => getByTestId('search-table'));

    // Check the 'Add Selected to Cart' button is disabled
    const addCartBtn = (await waitFor(() =>
      getByRole('button', {
        name: 'shopping-cart Add Selected to Cart',
      })
    )) as HTMLButtonElement;
    expect(addCartBtn).toBeTruthy();
    expect(addCartBtn.disabled).toBeTruthy();
  });

  it('handles saving a search criteria', async () => {
    const { getByRole, getByTestId } = render(<Search {...defaultProps} />);

    // Check search component renders
    const searchComponent = await waitFor(() => getByTestId('search'));
    expect(searchComponent).toBeTruthy();

    // Wait for search table to render
    await waitFor(() => getByTestId('search-table'));

    // Click on save button
    const saveBtn = await waitFor(() =>
      getByRole('button', { name: 'book Save Search' })
    );
    expect(saveBtn).toBeTruthy();
    fireEvent.click(saveBtn);

    // Wait for search component to re-render
    await waitFor(() => getByTestId('search'));
  });
});

describe('test parseFacets()', () => {
  it('successfully parses an object of arrays into an array of tuples', () => {
    const facets: RawFacets = {
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
  let defaultFacets: DefaultFacets;
  let activeFacets: ActiveFacets;
  let textInputs: TextInputs;

  beforeEach(() => {
    defaultFacets = { latest: true, replica: false };
    activeFacets = {
      facet_1: ['option1', 'option2'],
      facet_2: ['option1', 'option2'],
    };
    textInputs = ['foo', 'bar'];
  });

  it('successfully generates a stringified version of the active constraints', () => {
    const strConstraints = stringifyConstraints(
      defaultFacets,
      activeFacets,
      textInputs
    );
    expect(strConstraints).toEqual(
      '(latest = true) AND (replica = false) AND (Text Input = foo OR bar) AND (facet_1 = option1 OR option2) AND (facet_2 = option1 OR option2)'
    );
  });
  it('successfully generates a stringified version of the active constraints w/o textInputs', () => {
    const strConstraints = stringifyConstraints(
      defaultFacets,
      activeFacets,
      []
    );
    expect(strConstraints).toEqual(
      '(latest = true) AND (replica = false) AND (facet_1 = option1 OR option2) AND (facet_2 = option1 OR option2)'
    );
  });
  it('successfully generates a stringified version of the active constraints w/o activeFacets', () => {
    const strConstraints = stringifyConstraints(defaultFacets, {}, textInputs);
    expect(strConstraints).toEqual(
      '(latest = true) AND (replica = false) AND (Text Input = foo OR bar)'
    );
  });
});

describe('test checkConstraintsExist()', () => {
  let activeFacets: ActiveFacets;
  let textInputs: TextInputs;

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
