import { within, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { vi } from 'vitest';
import {
  activeSearchQueryFixture,
  ESGFSearchAPIFixture,
  rawSearchResultFixture,
  stacSearchResultsFixture,
  stacAggregationsFixture,
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

// helper to run long tests

const defaultProps: Props = {
  onUpdateCart: vi.fn(),
};

// Reset all mocks after each test
afterEach(() => {
  vi.clearAllMocks();
});

beforeEach(() => {
  Object.defineProperty(navigator, 'clipboard', {
    value: {
      writeText: vi.fn(),
      readText: vi.fn(() => Promise.resolve('')), // Mock initial empty clipboard
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

  it(
    'runs the side effect to set the current url when there is an activeProject object with a facetsUrl key',
    async () => {
      customRender(<Search {...defaultProps} />);

      // Check search component renders
      const searchComponent = await screen.findByTestId('search');
      expect(searchComponent).toBeTruthy();

      // Check if the 'Open as Json' button renders
      const jsonBtn = await screen.findByRole('img', { name: 'export' });
      expect(jsonBtn).toBeTruthy();
    },
  );

  it('renders query string', async () => {
    customRender(<Search {...defaultProps} />);

    // Check search component renders
    const searchComponent = await screen.findByTestId('search');
    expect(searchComponent).toBeTruthy();

    // Check renders results string (flexible matcher because text is split across nodes)
    const spanResults = await screen.findByTestId('search-results-span');
    expect(spanResults).toBeTruthy();
    expect(spanResults.textContent).toMatch(/3\s*results found for/i);
    // Ensure the query value also renders nearby
    expect(await within(spanResults.parentElement as HTMLElement).findByText('test1')).toBeTruthy();

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
    // Clipboard URL may include a port (e.g. :3000) depending on environment; assert key parts
    expect(navigator.clipboard.writeText).toHaveBeenCalled();
    const clipboardArg = (navigator.clipboard.writeText as any).mock.calls[0][0];
    expect(clipboardArg).toContain('?project=test1');
    expect(clipboardArg).toContain('textInputs=%5B%22foo%22%5D');

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
    const expectedSearchText = `#===============================================================================
# Facets listed below WERE NOT applied (not supported in Esgpull):
# UNAPPLIED: foo:'\"option1,option2\"'
# UNAPPLIED: baz:'\"option1\"'
#===============================================================================
# Esgpull Search Query:
esgpull search project:'\"test1\"' [\"foo\"] --latest true`;
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
    const expectedSearchText = `#===============================================================================
# Facets listed below WERE NOT applied (not supported in Esgpull):
# UNAPPLIED: foo:'\"option1,option2\"'
# UNAPPLIED: baz:'\"option1\"'
#===============================================================================
# Espull Download Command:
\`esgpull add project:'\"test1\"' [\"foo\"] --latest true --track | tail -n1\`; esgpull download --disable-ssl`;
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
  const projectName = 'testProject';
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
      projectName,
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
      projectName,
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
      projectName,
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
      projectName,
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

describe('STAC project behavior', () => {
  it('renders STAC filter string', async () => {
    // Set atoms to represent a STAC project
    AtomWrapper.modifyAtomValue(AppStateKeys.currentProject, {
      name: 'CMIP6',
      isSTAC: true,
      projectName: 'CMIP6',
    });

    const active = activeSearchQueryFixture();
    AtomWrapper.modifyAtomValue(AppStateKeys.activeSearchQuery, {
      ...active,
      project: {
        name: 'CMIP6',
        isSTAC: true,
        projectName: 'CMIP6',
        facetsUrl: 'offset=0&limit=0',
      },
    });

    // Mock STAC aggregations and STAC search endpoints
    server.use(
      rest.post(apiRoutes.esgfAggregationsSTAC.path, (_req, res, ctx) =>
        res(ctx.status(200), ctx.json(stacAggregationsFixture())),
      ),
      rest.post(apiRoutes.esgfSearchSTAC.path, (_req, res, ctx) =>
        res(ctx.status(200), ctx.json(stacSearchResultsFixture().search)),
      ),
    );

    customRender(<Search {...defaultProps} />, { usesAtoms: true });

    // Wait for results/table
    await screen.findByTestId('search-table');

    // STAC label should be shown
    expect(await screen.findByText('STAC Filter String:')).toBeTruthy();

    // Open save search dropdown to reveal disabled buttons
    // Wait for the dropdown trigger to be in the DOM then click it
    await waitFor(() => {
      const el = document.querySelector('.ant-dropdown-trigger');
      if (!el) throw new Error('dropdown trigger not found');
    });
    const copyDropDownIcon = document.querySelector('.ant-dropdown-trigger') as HTMLElement;
    await userEvent.hover(copyDropDownIcon);

    // result count should reflect STAC numMatched
    const { numMatched } = stacSearchResultsFixture().search;
    expect(
      await screen.findByText(
        (content) => content.includes(`${numMatched}`) && content.includes('results found for'),
      ),
    ).toBeTruthy();
  });
});
