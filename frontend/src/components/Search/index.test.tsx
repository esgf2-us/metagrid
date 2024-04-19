import { act, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import {
  activeSearchQueryFixture,
  ESGFSearchAPIFixture,
  rawSearchResultFixture,
  userCartFixture,
} from '../../api/mock/fixtures';
import { rest, server } from '../../api/mock/server';
import apiRoutes from '../../api/routes';
import customRender from '../../test/custom-render';
import { ActiveFacets, RawFacets } from '../Facets/types';
import Search, {
  checkFiltersExist,
  parseFacets,
  Props,
  stringifyFilters,
} from './index';
import {
  ActiveSearchQuery,
  RawSearchResult,
  ResultType,
  TextInputs,
  VersionType,
} from './types';
import { getRowName, selectDropdownOption } from '../../test/jestTestFunctions';

const user = userEvent.setup();

const defaultProps: Props = {
  activeSearchQuery: activeSearchQueryFixture(),
  userCart: [],
  onRemoveFilter: jest.fn(),
  onClearFilters: jest.fn(),
  onUpdateCart: jest.fn(),
  onUpdateAvailableFacets: jest.fn(),
  onSaveSearchQuery: jest.fn(),
  onShareSearchQuery: jest.fn(),
};

// Reset all mocks after each test
afterEach(() => {
  jest.clearAllMocks();
});

describe('test Search component', () => {
  it('renders component', async () => {
    const { getByTestId } = customRender(<Search {...defaultProps} />);

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
      rest.get(apiRoutes.esgfSearch.path, (_req, res, ctx) =>
        res(ctx.status(404))
      )
    );

    const { getByTestId } = customRender(<Search {...defaultProps} />);

    // Check if Alert component renders
    const alert = await waitFor(() => getByTestId('alert-fetching'));
    expect(alert).toBeTruthy();
  });

  it('runs the side effect to set the current url when there is an activeProject object with a facetsUrl key', async () => {
    const { getByRole, getByTestId } = customRender(
      <Search {...defaultProps} />
    );

    // Check search component renders
    const searchComponent = await waitFor(() => getByTestId('search'));
    expect(searchComponent).toBeTruthy();

    // Check if the 'Open as Json' button renders
    const jsonBtn = await waitFor(() => getByRole('img', { name: 'export' }));
    expect(jsonBtn).toBeTruthy();
  });

  it('renders query string', async () => {
    const { getByRole, getByTestId, getByText } = customRender(
      <Search {...defaultProps} />
    );

    // Check search component renders
    const searchComponent = await waitFor(() => getByTestId('search'));
    expect(searchComponent).toBeTruthy();

    // Check renders results string
    const strResults = await waitFor(() =>
      getByRole('heading', {
        name: '3 results found for test1',
      })
    );
    expect(strResults).toBeTruthy();

    // Check renders query string
    const queryString = await waitFor(() =>
      getByText(
        'latest = true AND min_version = 20200101 AND max_version = 20201231 AND (Text Input = foo) AND (foo = option1 OR option2) AND (baz = option1)'
      )
    );
    expect(queryString).toBeTruthy();
  });

  it('renders an empty query string when no search parameters are set', async () => {
    // Rerender with no filters applied
    const emptySearchQuery: ActiveSearchQuery = {
      ...activeSearchQueryFixture(),
      versionType: 'all',
      minVersionDate: null,
      maxVersionDate: null,
      activeFacets: {},
      textInputs: [],
    };

    const { getByText } = customRender(
      <Search {...defaultProps} activeSearchQuery={emptySearchQuery} />
    );

    // Check renders query string
    const queryString = await waitFor(() => getByText('No filters applied'));
    expect(queryString).toBeTruthy();
  });

  it('clears all tags when selecting the "Clear All" tag', async () => {
    const { getByText, getByTestId } = customRender(
      <Search {...defaultProps} />
    );

    // Check search component renders
    const searchComponent = await waitFor(() => getByTestId('search'));
    expect(searchComponent).toBeTruthy();

    // Check if 'Clear All' button exists, then click it
    const clearAllBtn = await waitFor(() => getByText('Clear All'));
    expect(clearAllBtn).toBeTruthy();

    await act(async () => {
      await user.click(clearAllBtn);
    });

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
      rest.get(apiRoutes.esgfSearch.path, (_req, res, ctx) =>
        res(ctx.status(200), ctx.json(response))
      )
    );

    const { getByRole, getByTestId } = customRender(
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

    // Wait for the options to render, then select 20 / page
    await selectDropdownOption(user, pageSizeComboBox, '20 / page');

    // Change back to 10 / page
    await selectDropdownOption(user, pageSizeComboBox, '10 / page');

    // Select the 'Next Page' button (only enabled if there are > 10 results)
    const nextPage = await waitFor(() =>
      getByRole('listitem', { name: 'Next Page' })
    );

    await act(async () => {
      await user.click(nextPage);
    });

    // Wait for search table to re-render
    await waitFor(() => getByTestId('search-table'));
  });

  it('handles selecting a row"s checkbox in the table and adding to the cart', async () => {
    const { getByRole, getByTestId } = customRender(
      <Search {...defaultProps} />
    );

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
      name: getRowName('plus', 'question', 'foo', '3', '1', '1'),
    });
    expect(firstRow).toBeTruthy();

    // Select the first row's checkbox
    const firstCheckBox = within(firstRow).getByRole('checkbox');
    expect(firstCheckBox).toBeTruthy();

    await act(async () => {
      await user.click(firstCheckBox);
    });

    // Check 'Add Selected to Cart' button is enabled and click it
    expect(addCartBtn.disabled).toBeFalsy();

    await act(async () => {
      await user.click(addCartBtn);
    });

    // Wait for search component to re-render
    await waitFor(() => getByTestId('search'));
  });

  it('disables the "Add Selected to Cart" button when no items are in the cart', async () => {
    const { getByRole, getByTestId } = customRender(
      <Search {...defaultProps} />
    );

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

  it('disables the "Add Selected to Cart" button when all rows are already in the cart', async () => {
    // Render the component with userCart full
    const { getByRole } = customRender(
      <Search {...defaultProps} userCart={userCartFixture()} />
    );

    // Check the 'Add Selected to Cart' button is disabled
    const addCartBtn = (await waitFor(() =>
      getByRole('button', {
        name: 'shopping-cart Add Selected to Cart',
      })
    )) as HTMLButtonElement;

    expect(addCartBtn.disabled).toBeTruthy();
  });

  it('handles saving a search query', async () => {
    const { getByRole, getByTestId } = customRender(
      <Search {...defaultProps} />
    );

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

    await act(async () => {
      await user.click(saveBtn);
    });

    // Wait for search component to re-render
    await waitFor(() => getByTestId('search'));
  });

  it('handles copying search query to clipboard', async () => {
    const { getByRole, getByTestId } = customRender(
      <Search {...defaultProps} />
    );

    // Check search component renders
    const searchComponent = await waitFor(() => getByTestId('search'));
    expect(searchComponent).toBeTruthy();

    // Wait for search table to render
    await waitFor(() => getByTestId('search-table'));

    // Click on cop button
    const copyBtn = await waitFor(() =>
      getByRole('button', { name: 'share-alt Copy Search' })
    );
    expect(copyBtn).toBeTruthy();

    await act(async () => {
      await user.click(copyBtn);
    });

    // Wait for search component to re-render
    await waitFor(() => getByTestId('search'));
  });
});

describe('test parseFacets()', () => {
  it('successfully parses an object of arrays into an array of tuples', () => {
    const facets: RawFacets = {
      data_node: ['option1', 1, 'option2', 2],
      facet2: ['option1', 1, 'option2', 2],
    };

    const result = {
      data_node: [
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
  const versionType: VersionType = 'latest';
  const resultType: ResultType = 'originals only';
  const minVersionDate = '20200101';
  const maxVersionDate = '20201231';
  let activeFacets: ActiveFacets;
  let textInputs: TextInputs;

  beforeEach(() => {
    activeFacets = {
      facet_1: ['option1', 'option2'],
      facet_2: ['option1', 'option2'],
    };
    textInputs = ['foo', 'bar'];
  });

  it('generates output', () => {
    const strFilters = stringifyFilters(
      versionType,
      resultType,
      minVersionDate,
      maxVersionDate,
      activeFacets,
      textInputs
    );
    expect(strFilters).toEqual(
      'latest = true AND replica = false AND min_version = 20200101 AND max_version = 20201231 AND (Text Input = foo OR bar) AND (facet_1 = option1 OR option2) AND (facet_2 = option1 OR option2)'
    );
  });
  it('generates output w/o textInputs', () => {
    const strFilters = stringifyFilters(
      versionType,
      resultType,
      minVersionDate,
      maxVersionDate,
      activeFacets,
      []
    );
    expect(strFilters).toEqual(
      'latest = true AND replica = false AND min_version = 20200101 AND max_version = 20201231 AND (facet_1 = option1 OR option2) AND (facet_2 = option1 OR option2)'
    );
  });
  it('generates output w/o activeFacets', () => {
    const strFilters = stringifyFilters(
      versionType,
      resultType,
      minVersionDate,
      maxVersionDate,
      {},
      textInputs
    );
    expect(strFilters).toEqual(
      'latest = true AND replica = false AND min_version = 20200101 AND max_version = 20201231 AND (Text Input = foo OR bar)'
    );
  });
  it('generates output w/o version type', () => {
    const strFilters = stringifyFilters(
      'all',
      resultType,
      minVersionDate,
      maxVersionDate,
      {},
      textInputs
    );
    expect(strFilters).toEqual(
      'replica = false AND min_version = 20200101 AND max_version = 20201231 AND (Text Input = foo OR bar)'
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
