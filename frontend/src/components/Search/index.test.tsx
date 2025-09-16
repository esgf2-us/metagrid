import { within, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import {
  activeSearchQueryFixture,
  ESGFSearchAPIFixture,
  rawSearchResultFixture,
} from '../../test/mock/fixtures';
import { rest, server } from '../../test/mock/server';
import apiRoutes from '../../api/routes';
import customRender from '../../test/custom-render';
import { ActiveFacets, RawFacets } from '../Facets/types';
import Search, { checkFiltersExist, parseFacets, Props, stringifyFilters } from './index';
import { ActiveSearchQuery, RawSearchResult, ResultType, TextInputs, VersionType } from './types';
import { openDropdownList, AtomWrapper } from '../../test/jestTestFunctions';
import { AppStateKeys } from '../../common/atoms';

const user = userEvent.setup();

const defaultProps: Props = {
  onUpdateCart: jest.fn(),
};

// Reset all mocks after each test
afterEach(() => {
  jest.clearAllMocks();
});

beforeEach(() => {
  Object.defineProperty(navigator, 'clipboard', {
    value: {
      writeText: jest.fn(),
      readText: jest.fn(() => Promise.resolve('')), // Mock initial empty clipboard
    },
    writable: true,
  });
});

describe('test Search component', () => {
  it('renders component', async () => {
    customRender(<Search {...defaultProps} />);

    // Check search component renders
    const searchComponent = await screen.findByTestId('search');
    expect(searchComponent).toBeTruthy();

    // Check search table renders
    const searchTable = await screen.findByTestId('search-table');
    expect(searchTable).toBeTruthy();
  });

  it('renders Alert component if there is an error fetching results', async () => {
    server.use(
      // ESGF Search API - datasets
      rest.get(apiRoutes.esgfSearch.path, (_req, res, ctx) => res(ctx.status(404))),
    );

    customRender(<Search {...defaultProps} />);

    // Check if Alert component renders
    const alert = await screen.findByTestId('alert-fetching');
    expect(alert).toBeTruthy();
  });

  it('runs the side effect to set the current url when there is an activeProject object with a facetsUrl key', async () => {
    customRender(<Search {...defaultProps} />);

    // Check search component renders
    const searchComponent = await screen.findByTestId('search');
    expect(searchComponent).toBeTruthy();

    // Check if the 'Open as Json' button renders
    const jsonBtn = await screen.findByRole('img', { name: 'export' });
    expect(jsonBtn).toBeTruthy();
  });

  it('renders query string', async () => {
    customRender(<Search {...defaultProps} />);

    // Check search component renders
    const searchComponent = await screen.findByTestId('search');
    expect(searchComponent).toBeTruthy();

    // Check renders results string
    const strResults = await screen.findByRole('heading', {
      name: '3 results found for test1',
    });
    expect(strResults).toBeTruthy();

    // Check renders query string
    const queryString = await screen.findByText(
      'latest = true AND min_version = 20200101 AND max_version = 20201231 AND (Text Input = foo) AND (foo = option1 OR option2) AND (baz = option1)',
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

    AtomWrapper.modifyAtomValue(AppStateKeys.activeSearchQuery, emptySearchQuery);
    customRender(<Search {...defaultProps} />);

    // Check renders query string
    const queryString = await screen.findByText('No filters applied');
    expect(queryString).toBeTruthy();
  });

  it('clears all tags when selecting the "Clear All" tag', async () => {
    customRender(<Search {...defaultProps} />);

    // Check search component renders
    const searchComponent = await screen.findByTestId('search');
    expect(searchComponent).toBeTruthy();

    // Check if 'Clear All' button exists, then click it
    const clearAllBtn = await screen.findByText('Clear All');
    expect(clearAllBtn).toBeTruthy();

    await user.click(clearAllBtn);

    // Wait for search component to re-render
    await screen.findByTestId('search');
  });

  it('handles pagination and page size changes', async () => {
    // Update api to return 20 search results, which enables pagination if 10/page selected
    const data = ESGFSearchAPIFixture();
    const response = {
      ...data,
      response: {
        docs: new Array(20)
          .fill(rawSearchResultFixture())
          .map((obj, index) => ({ ...obj, id: `id_${index}` }) as RawSearchResult),
        numFound: 20,
      },
    };

    server.use(
      rest.get(apiRoutes.esgfSearch.path, (_req, res, ctx) =>
        res(ctx.status(200), ctx.json(response)),
      ),
    );

    customRender(<Search {...defaultProps} />);

    // Select the combobox drop down and update its value to render options
    const paginationList = await screen.findByRole('list');
    const pageSizeComboBox = await within(paginationList).findByRole('combobox');

    await openDropdownList(user, pageSizeComboBox);

    await userEvent.click(await screen.findByTestId('pageSize-option-20'));

    expect(screen.getByTestId('cart-items-row-11')).toBeInTheDocument();
  });

  it('handles selecting a row"s checkbox in the table and adding to the cart', async () => {
    AtomWrapper.modifyAtomValue(AppStateKeys.userCart, []);
    customRender(<Search {...defaultProps} />);

    // Check search component renders
    const searchComponent = await screen.findByTestId('search');
    expect(searchComponent).toBeTruthy();

    // Wait for search to re-render from side-effect
    await screen.findByTestId('search-table');

    // Check the 'Add Selected to Cart' button is disabled
    const addCartBtn: HTMLButtonElement = await screen.findByRole('button', {
      name: 'shopping-cart Add Selected to Cart',
    });
    expect(addCartBtn).toBeTruthy();
    expect(addCartBtn).toBeDisabled();

    // Select the first row
    const firstRow = await screen.findByTestId('cart-items-row-1');
    expect(firstRow).toBeTruthy();

    // Select the first row's checkbox
    const firstCheckBox = await within(firstRow).findByRole('checkbox');
    expect(firstCheckBox).toBeTruthy();

    await user.click(firstCheckBox);

    // Check 'Add Selected to Cart' button is enabled and click it
    expect(addCartBtn).toBeEnabled();
    await user.click(addCartBtn);

    // Wait for search component to re-render
    await screen.findByTestId('search');
  });

  it('disables the "Add Selected to Cart" button when no items are in the cart', async () => {
    customRender(<Search {...defaultProps} />);

    // Check search component renders
    const searchComponent = await screen.findByTestId('search');
    expect(searchComponent).toBeTruthy();

    // Wait for search to re-render
    await screen.findByTestId('search-table');

    // Check the 'Add Selected to Cart' button is disabled
    const addCartBtn: HTMLButtonElement = await screen.findByRole('button', {
      name: 'shopping-cart Add Selected to Cart',
    });
    expect(addCartBtn).toBeTruthy();
    expect(addCartBtn).toBeDisabled();
  });

  it('disables the "Add Selected to Cart" button when all rows are already in the cart', async () => {
    // Render the component with userCart full
    customRender(<Search {...defaultProps} />);

    // Check the 'Add Selected to Cart' button is disabled
    const addCartBtn: HTMLButtonElement = await screen.findByRole('button', {
      name: 'shopping-cart Add Selected to Cart',
    });

    expect(addCartBtn).toBeTruthy();
    expect(addCartBtn).toBeDisabled();
  });

  it('handles saving a search query', async () => {
    AtomWrapper.modifyAtomValue(AppStateKeys.userSearchQueries, []);
    customRender(<Search {...defaultProps} />, { usesAtoms: true, authenticated: true });

    // Check search component renders
    const searchComponent = await screen.findByTestId('search');
    expect(searchComponent).toBeTruthy();

    // Wait for search table to render
    await screen.findByTestId('search-table');

    // Click on save button
    const saveBtn = await screen.findByTestId('save-search-btn');
    expect(saveBtn).toBeTruthy();

    await user.click(saveBtn);

    // Wait for search component to re-render
    await screen.findByTestId('search');
  });

  it('handles saving a search query when unauthenticated', async () => {
    customRender(<Search {...defaultProps} />, { usesAtoms: true, authenticated: false });

    // Check search component renders
    const searchComponent = await screen.findByTestId('search');
    expect(searchComponent).toBeTruthy();

    // Wait for search table to render
    await screen.findByTestId('search-table');

    // Click on save button
    const saveBtn = await screen.findByTestId('save-search-btn');
    expect(saveBtn).toBeTruthy();

    await user.click(saveBtn);

    // Wait for search component to re-render
    await screen.findByTestId('search');
  });

  it('handles copying search query to clipboard', async () => {
    customRender(<Search {...defaultProps} />);

    // Check search component renders
    const searchComponent = await screen.findByTestId('search');
    expect(searchComponent).toBeTruthy();

    // Wait for search table to render
    await screen.findByTestId('search-table');

    // Open copy dropdown
    const copyDropDownIcon = await screen.findByRole('img', { name: 'copy' });
    await userEvent.click(copyDropDownIcon);

    // Click on copy button
    const copyBtn = await screen.findByTestId('share-search-btn');
    expect(copyBtn).toBeTruthy();

    await user.click(copyBtn);

    // Check clipboard content
    const expectedSearchText =
      'http://localhost/?project=test1&minVersionDate=20200101&maxVersionDate=20201231&filenameVars=%5B%22var%22%5D&activeFacets=%7B%22foo%22%3A%5B%22option1%22%2C%22option2%22%5D%2C%22baz%22%3A%22option1%22%7D&textInputs=%5B%22foo%22%5D';
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(expectedSearchText);

    // Wait for search component to re-render
    await screen.findByTestId('search');
  });

  it('handles copying esgpull search query to clipboard', async () => {
    customRender(<Search {...defaultProps} />);

    // Check search component renders
    const searchComponent = await screen.findByTestId('search');
    expect(searchComponent).toBeTruthy();

    // Wait for search table to render
    await screen.findByTestId('search-table');

    // Open copy dropdown
    const copyDropDownIcon = await screen.findByRole('img', { name: 'copy' });
    await userEvent.click(copyDropDownIcon);

    // Click on copy button
    const copyBtn = await screen.findByTestId('copy-esgpull-search-btn');
    expect(copyBtn).toBeTruthy();

    await user.click(copyBtn);

    // Check clipboard content
    const expectedSearchText = 'esgpull search project:test1 ["foo"] --latest true';
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(expectedSearchText);

    // Wait for search component to re-render
    await screen.findByTestId('search');
  });

  it('handles copying esgpull download command to clipboard', async () => {
    customRender(<Search {...defaultProps} />);

    // Check search component renders
    const searchComponent = await screen.findByTestId('search');
    expect(searchComponent).toBeTruthy();

    // Wait for search table to render
    await screen.findByTestId('search-table');

    // Open copy dropdown
    const copyDropDownIcon = await screen.findByRole('img', { name: 'copy' });
    await userEvent.click(copyDropDownIcon);

    // Click on copy button
    const copyBtn = await screen.findByTestId('copy-esgpull-download-btn');
    expect(copyBtn).toBeTruthy();

    await user.click(copyBtn);

    // Check clipboard content
    const expectedSearchText =
      '`esgpull add project:test1 ["foo"] --latest true --track | tail -n1`; esgpull download --disable-ssl';
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(expectedSearchText);

    // Wait for search component to re-render
    await screen.findByTestId('search');
  });

  it('handles copying intake search query to clipboard', async () => {
    customRender(<Search {...defaultProps} />);

    // Check search component renders
    const searchComponent = await screen.findByTestId('search');
    expect(searchComponent).toBeTruthy();

    // Wait for search table to render
    await screen.findByTestId('search-table');

    // Open copy dropdown
    const copyDropDownIcon = await screen.findByRole('img', { name: 'copy' });
    await userEvent.click(copyDropDownIcon);

    // Click on copy button
    const copyBtn = await screen.findByTestId('copy-intake-search-btn');
    expect(copyBtn).toBeTruthy();

    await user.click(copyBtn);

    // Check clipboard content
    const expectedSearchText =
      "from intake_esgf import ESGFCatalog\ncat=ESGFCatalog()\n\nmetagrid_search=cat.search(foo=['option1', 'option2'], baz='option1', latest=True)";
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(expectedSearchText);

    // Wait for search component to re-render
    await screen.findByTestId('search');
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
      textInputs,
    );
    expect(strFilters).toEqual(
      'latest = true AND replica = false AND min_version = 20200101 AND max_version = 20201231 AND (Text Input = foo OR bar) AND (facet_1 = option1 OR option2) AND (facet_2 = option1 OR option2)',
    );
  });
  it('generates output w/o textInputs', () => {
    const strFilters = stringifyFilters(
      versionType,
      resultType,
      minVersionDate,
      maxVersionDate,
      activeFacets,
      [],
    );
    expect(strFilters).toEqual(
      'latest = true AND replica = false AND min_version = 20200101 AND max_version = 20201231 AND (facet_1 = option1 OR option2) AND (facet_2 = option1 OR option2)',
    );
  });
  it('generates output w/o activeFacets', () => {
    const strFilters = stringifyFilters(
      versionType,
      resultType,
      minVersionDate,
      maxVersionDate,
      {},
      textInputs,
    );
    expect(strFilters).toEqual(
      'latest = true AND replica = false AND min_version = 20200101 AND max_version = 20201231 AND (Text Input = foo OR bar)',
    );
  });
  it('generates output w/o version type', () => {
    const strFilters = stringifyFilters(
      'all',
      resultType,
      minVersionDate,
      maxVersionDate,
      {},
      textInputs,
    );
    expect(strFilters).toEqual(
      'replica = false AND min_version = 20200101 AND max_version = 20201231 AND (Text Input = foo OR bar)',
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
