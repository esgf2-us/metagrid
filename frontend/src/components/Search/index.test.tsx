import { fireEvent, render, waitFor, within } from '@testing-library/react';
import React from 'react';
import {
  defaultFacetsFixture,
  ESGFSearchAPIFixture,
  rawSearchResultFixture,
} from '../../api/mock/fixtures';
import { rest, server } from '../../api/mock/setup-env';
import apiRoutes from '../../api/routes';
import { esgfNodeURL, proxyURL } from '../../env';
import { ActiveFacets, DefaultFacets, RawFacets } from '../Facets/types';
import Search, {
  checkFiltersExist,
  parseFacets,
  Props,
  stringifyFilters,
} from './index';
import { RawSearchResult, TextInputs } from './types';

const defaultProps: Props = {
  activeProject: { name: 'foo', facetsUrl: 'https://fubar.gov/?' },
  defaultFacets: defaultFacetsFixture(),
  activeFacets: { foo: ['option1', 'option2'], baz: ['option1'] },
  textInputs: ['foo'],
  userCart: [],
  onRemoveFilter: jest.fn(),
  onClearFilters: jest.fn(),
  onUpdateCart: jest.fn(),
  onUpdateProjectFacets: jest.fn(),
  onSaveSearchQuery: jest.fn(),
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
        `${proxyURL}/${esgfNodeURL}/esg-search/search/`,
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

  it('renders activeFacets and textInputs as stringified filters', async () => {
    const { getByRole, getByTestId } = render(<Search {...defaultProps} />);

    // Check search component renders
    const searchComponent = await waitFor(() => getByTestId('search'));
    expect(searchComponent).toBeTruthy();

    // Check for stringified filters text
    const strFilters = await waitFor(() =>
      getByRole('heading', {
        name: '2 results found for foo',
      })
    );

    expect(strFilters).toBeTruthy();
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
    const data = ESGFSearchAPIFixture();
    const response = {
      ...data,
      response: {
        docs: new Array(20)
          .fill(rawSearchResultFixture())
          .map(
            (obj, index) => ({ ...obj, id: `id_${index}` } as RawSearchResult)
          ),
        numFound: 20,
      },
    };

    server.use(
      rest.get(apiRoutes.esgfDatasets, (_req, res, ctx) => {
        return res(ctx.status(200), ctx.json(response));
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

describe('test stringifyFilters()', () => {
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

  it('successfully generates a stringified version of the active filters', () => {
    const strFilters = stringifyFilters(
      defaultFacets,
      activeFacets,
      textInputs
    );
    expect(strFilters).toEqual(
      '(latest = true) AND (replica = false) AND (Text Input = foo OR bar) AND (facet_1 = option1 OR option2) AND (facet_2 = option1 OR option2)'
    );
  });
  it('successfully generates a stringified version of the active filters w/o textInputs', () => {
    const strFilters = stringifyFilters(defaultFacets, activeFacets, []);
    expect(strFilters).toEqual(
      '(latest = true) AND (replica = false) AND (facet_1 = option1 OR option2) AND (facet_2 = option1 OR option2)'
    );
  });
  it('successfully generates a stringified version of the active filters w/o activeFacets', () => {
    const strFilters = stringifyFilters(defaultFacets, {}, textInputs);
    expect(strFilters).toEqual(
      '(latest = true) AND (replica = false) AND (Text Input = foo OR bar)'
    );
  });
});

describe('test checkFiltersExist()', () => {
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
    const filtersExist = checkFiltersExist(activeFacets, textInputs);
    expect(filtersExist).toBeTruthy();
  });
  it('returns true when only textInputs exist', () => {
    const filtersExist = checkFiltersExist({}, textInputs);
    expect(filtersExist).toBeTruthy();
  });

  it('returns true when only activeFacets exist', () => {
    const filtersExist = checkFiltersExist(activeFacets, []);
    expect(filtersExist).toBeTruthy();
  });

  it('returns false if filters do not exist', () => {
    const filtersExist = checkFiltersExist({}, []);
    expect(filtersExist).toBeFalsy();
  });
});
