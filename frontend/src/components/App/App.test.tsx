/**
 * This file contains tests for the App component.
 *
 * The App component uses React Router and React Context, so it must be wrapped
 * in order to mock their behaviors.
 *
 */
import { fireEvent, within, screen } from '@testing-library/react';
import React from 'react';
import userEvent from '@testing-library/user-event';
import { rest, server } from '../../test/mock/server';
import apiRoutes from '../../api/routes';
import { delay } from '../../common/reactJoyrideSteps';
import { getSearchFromUrl } from '../../common/utils';
import customRender from '../../test/custom-render';
import { ActiveSearchQuery } from '../Search/types';
import App from './App';
import {
  activeSearch,
  RecoilWrapper,
  submitKeywordSearch,
} from '../../test/jestTestFunctions';
import { userCartAtom } from './recoil/atoms';

const user = userEvent.setup();

describe('test main components', () => {
  it('renders App component', async () => {
    customRender(<App searchQuery={activeSearch} />);

    // Check applicable components render
    const navComponent = await screen.findByTestId('nav-bar');
    expect(navComponent).toBeTruthy();
    const facetsComponent = await screen.findByTestId('search-facets');
    expect(facetsComponent).toBeTruthy();
    expect(await screen.findByTestId('search')).toBeTruthy();
  });

  it('renders App component with undefined search query', async () => {
    customRender(<App searchQuery={(undefined as unknown) as ActiveSearchQuery} />, {
      usesRecoil: true,
    });

    // Check applicable components render
    const navComponent = await screen.findByTestId('nav-bar');
    expect(navComponent).toBeTruthy();
    const facetsComponent = await screen.findByTestId('search-facets');
    expect(facetsComponent).toBeTruthy();
    expect(await screen.findByTestId('search')).toBeTruthy();
  });

  it('renders App component with project only search query', async () => {
    customRender(<App searchQuery={getSearchFromUrl('?project=CMIP5')} />);

    // Check applicable components render
    const navComponent = await screen.findByTestId('nav-bar');
    expect(navComponent).toBeTruthy();
    const facetsComponent = await screen.findByTestId('search-facets');
    expect(facetsComponent).toBeTruthy();
    expect(await screen.findByTestId('search')).toBeTruthy();
  });

  it('shows duplicate error when search keyword is typed in twice', async () => {
    customRender(<App searchQuery={activeSearch} />);

    const input = 'foo';
    await submitKeywordSearch(input, user);

    // Change the value for free-text input to 'foo' again and submit
    await submitKeywordSearch(input, user);

    // Check error message appears that input has already been applied
    const errorMsg = await screen.findByText(`Input "${input}" has already been applied`);
    expect(errorMsg).toBeTruthy();
  });

  it('handles setting filename searches and duplicates', async () => {
    customRender(<App searchQuery={activeSearch} />);

    // Check applicable components render
    const leftSearchColumn = await screen.findByTestId('search-facets');
    expect(leftSearchColumn).toBeTruthy();

    const facetsForm = await screen.findByTestId('facets-form');
    expect(facetsForm).toBeTruthy();

    // Check error message appears that input has already been applied
    const input = 'var';

    // Open filename collapse panel
    const filenameSearchPanel = await screen.findByTestId('filename-collapse');

    await userEvent.click(filenameSearchPanel);

    // Change form field values
    const inputField = await screen.findByTestId('filename-search-input');

    await user.type(inputField, input);

    // Submit the form
    const filenameVarsSubmitBtn = await screen.findByTestId('filename-search-submit-btn');

    await userEvent.click(filenameVarsSubmitBtn);

    // Wait for components to rerender
    await screen.findByTestId('search');

    await user.type(inputField, input);
    await userEvent.click(filenameVarsSubmitBtn);

    // Wait for components to rerender
    await screen.findByTestId('search');

    // Check error message appears that input has already been applied
    const errorMsg = await screen.findByText(`Input "${input}" has already been applied`);
    expect(errorMsg).toBeTruthy();
  });

  it('handles setting and removing text input filters and clearing all search filters', async () => {
    customRender(<App searchQuery={activeSearch} />);

    // Change value for free-text input
    await submitKeywordSearch('foo', user);

    // Check tag renders
    const tag = await screen.findByTestId('foo');
    expect(tag).toBeTruthy();

    // Click on the ClearAllTag
    const clearAllTag = await screen.findByText('Clear All');
    expect(clearAllTag).toBeTruthy();

    await userEvent.click(clearAllTag);

    // Change value for free-text input and submit again
    await submitKeywordSearch('baz', user);

    // Wait for components to rerender
    await screen.findByTestId('search');

    // Check baz tag exists
    const bazTag = await screen.findByTestId('baz');
    expect(bazTag).toBeTruthy();

    // Close the baz tag
    await userEvent.click(within(bazTag).getByRole('img', { name: 'close' }));

    // Wait for components to rerender
    await screen.findByTestId('search');
  });

  it('handles applying general facets', async () => {
    customRender(<App searchQuery={activeSearch} />);
    const facetsForm = await screen.findByTestId('facets-form', {}, { timeout: 3000 });
    expect(facetsForm).toBeTruthy();

    // Open additional properties collapse panel
    const additionalPropertiesPanel = await within(facetsForm).findByRole('button', {
      name: 'expanded Additional Properties',
    });
    await userEvent.click(additionalPropertiesPanel);

    // Check facet select form exists and mouseDown to expand list of options
    const resultTypeSelect = await screen.findByTestId('result-type-form-select');
    expect(resultTypeSelect).toBeTruthy();
    fireEvent.mouseDown(resultTypeSelect.firstElementChild as HTMLInputElement);

    // Select the first facet option
    const resultTypeOption = await screen.findByText('Originals Only');
    expect(resultTypeOption).toBeTruthy();

    await userEvent.click(resultTypeOption);
    await screen.findByTestId('facets-form');

    await screen.findByTestId('search');
  });

  it('handles applying and removing project facets', async () => {
    customRender(<App searchQuery={activeSearch} />);

    // Check applicable components render
    const facetsComponent = await screen.findByTestId('search-facets');
    expect(facetsComponent).toBeTruthy();

    // Open top collapse panel
    const group1Panel = await within(facetsComponent).findByRole('button', {
      name: 'collapsed Group1',
    });

    await userEvent.click(group1Panel);

    // Open Collapse Panel in Collapse component for the data_node form to render
    const collapse = await screen.findByText('Data Node');

    await userEvent.click(collapse);

    // Check facet select form exists and mouseDown to expand list of options
    const facetFormSelect = await screen.findByTestId('data_node-form-select');
    expect(facetFormSelect).toBeTruthy();
    fireEvent.mouseDown(facetFormSelect.firstElementChild as HTMLInputElement);

    // Select the first facet option
    const facetOption = await screen.findByTestId('data_node_aims3.llnl.gov');
    expect(facetOption).toBeTruthy();
    await userEvent.click(facetOption);

    // Apply facets
    fireEvent.keyDown(facetFormSelect, {
      key: 'Escape',
      code: 'Escape',
      keyCode: '27',
      charCode: '27',
    });

    // Wait for components to rerender
    await screen.findByTestId('search');

    // Check facet option applied
    const tag = await screen.findByTestId('aims3.llnl.gov');
    expect(tag).toBeTruthy();

    // Check facets select form rerenders and mouseDown to expand list of options
    const facetFormSelectRerender = await screen.findByTestId('data_node-form-select');
    expect(facetFormSelectRerender).toBeTruthy();

    fireEvent.mouseDown(facetFormSelectRerender.firstElementChild as HTMLInputElement);

    // Check option is selected and remove it
    const facetOptionRerender = await within(facetFormSelectRerender).findByRole('img', {
      name: 'close',
      hidden: true,
    });
    expect(facetOptionRerender).toBeTruthy();

    await userEvent.click(facetOptionRerender);

    // Remove facets
    fireEvent.keyDown(facetFormSelectRerender, {
      key: 'Escape',
      code: 'Escape',
      keyCode: '27',
      charCode: '27',
    });

    // Wait for component to rerender
    await screen.findByTestId('search');
  });

  it('fetches the data node status every defined interval', async () => {
    jest.useFakeTimers();

    customRender(<App searchQuery={activeSearch} />);

    jest.advanceTimersByTime(295000);
    jest.useRealTimers();

    // Check applicable components render
    const facetsComponent = await screen.findByTestId('search-facets');
    expect(facetsComponent).toBeTruthy();
  });
});

describe('User cart', () => {
  it('handles authenticated user adding and removing items from cart', async () => {
    RecoilWrapper.modifyAtomValue(userCartAtom.key, []);
    customRender(<App searchQuery={activeSearch} />);

    // Wait for components to rerender
    await screen.findByTestId('main-query-string-label');

    // Check first row has add button and click it
    const addBtn = await screen.findByTestId('row-0-add-to-cart');
    expect(addBtn).toBeTruthy();

    await userEvent.click(addBtn);

    // Check 'Added items(s) to the cart' message appears
    const addText = await screen.findByText('Added item(s) to your cart');
    expect(addText).toBeTruthy();

    // Check first row has remove button and click it
    const removeBtn = await screen.findByTestId('row-0-remove-from-cart');
    expect(removeBtn).toBeTruthy();

    await userEvent.click(removeBtn);

    // Check 'Removed items(s) from the cart' message appears
    const removeText = await screen.findByText('Removed item(s) from your cart');
    expect(removeText).toBeTruthy();
  });

  it("displays authenticated user's number of files in the cart summary and handles clearing the cart", async () => {
    customRender(<App searchQuery={activeSearch} />);

    // Wait for components to rerender
    await screen.findByTestId('main-query-string-label');

    // Check applicable components render
    const rightMenuComponent = await screen.findByTestId('right-menu');
    expect(rightMenuComponent).toBeTruthy();

    // Click on the cart link
    const cartLink = await within(rightMenuComponent).findByRole('img', {
      name: 'shopping-cart',
    });
    expect(cartLink).toBeTruthy();

    await userEvent.click(cartLink);

    // Check number of files and datasets are correctly displayed
    const cartSummary = await screen.findByTestId('summary');
    expect(cartSummary).toBeTruthy();

    const numDatasetsField = await within(cartSummary).findByText('Total Number of Datasets:');
    const numFilesText = await within(cartSummary).findByText('Total Number of Files:');
    expect(numDatasetsField.textContent).toEqual('Total Number of Datasets: 3');
    expect(numFilesText.textContent).toEqual('Total Number of Files: 8');
    const numSelectedDatasetsField = await within(cartSummary).findByText(
      'Selected Number of Datasets:'
    );
    const numSelectedFilesText = await within(cartSummary).findByText('Selected Number of Files:');
    expect(numSelectedDatasetsField.textContent).toEqual('Selected Number of Datasets: 0');
    expect(numSelectedFilesText.textContent).toEqual('Selected Number of Files: 0');

    // Check "Remove All Items" button renders with cart > 0 items and click it
    const clearCartBtn = await screen.findByTestId('clear-cart-button');
    expect(clearCartBtn).toBeTruthy();

    await userEvent.click(clearCartBtn);

    // Check confirmBtn exists in popover and click it
    const confirmBtn = await screen.findByTestId('clear-all-cart-items-confirm-button');
    expect(confirmBtn).toBeTruthy();
    await userEvent.click(confirmBtn);

    // Check number of datasets and files are now 0
    expect(numDatasetsField.textContent).toEqual('Total Number of Datasets: 0');
    expect(numFilesText.textContent).toEqual('Total Number of Files: 0');

    // Check empty alert renders
    const emptyAlert = await screen.findByText('Your cart is empty');
    expect(emptyAlert).toBeTruthy();
  });

  it('handles anonymous user adding and removing items from cart', async () => {
    // Render component as anonymous
    RecoilWrapper.modifyAtomValue(userCartAtom.key, []);
    customRender(<App searchQuery={activeSearch} />, { authenticated: false });

    // Wait for components to rerender
    await screen.findByTestId('main-query-string-label');

    // Check first row has add button and click it
    const addBtn = await screen.findByTestId('row-0-add-to-cart');
    expect(addBtn).toBeTruthy();

    await userEvent.click(addBtn);

    // Check first row has remove button and click it
    const removeBtn = await screen.findByTestId('row-0-remove-from-cart');
    expect(removeBtn).toBeTruthy();

    await userEvent.click(removeBtn);
  });

  it('displays anonymous user"s number of files in the cart summary and handles clearing the cart', async () => {
    customRender(<App searchQuery={activeSearch} />, { usesRecoil: true, authenticated: false });

    // Wait for components to rerender
    await screen.findByTestId('main-query-string-label');

    // Check applicable components render
    const rightMenuComponent = await screen.findByTestId('right-menu');
    expect(rightMenuComponent).toBeTruthy();

    // Click on the cart link
    const cartLink = await within(rightMenuComponent).findByRole('img', {
      name: 'shopping-cart',
    });
    expect(cartLink).toBeTruthy();

    await userEvent.click(cartLink);

    // Check number of files and datasets are correctly displayed
    const cart = await screen.findByTestId('cart');
    expect(cart).toBeTruthy();
    const cartSummary = await screen.findByTestId('summary');
    expect(cartSummary).toBeTruthy();

    const numDatasetsField = await within(cartSummary).findByText('Total Number of Datasets:');
    const numFilesText = await within(cartSummary).findByText('Total Number of Files:');
    expect(numDatasetsField.textContent).toEqual('Total Number of Datasets: 3');
    expect(numFilesText.textContent).toEqual('Total Number of Files: 8');

    const numSelectedDatasetsField = await within(cartSummary).findByText(
      'Selected Number of Datasets:'
    );
    const numSelectedFilesText = await within(cartSummary).findByText('Selected Number of Files:');
    expect(numSelectedDatasetsField.textContent).toEqual('Selected Number of Datasets: 0');
    expect(numSelectedFilesText.textContent).toEqual('Selected Number of Files: 0');

    // Check "Remove All Items" button renders with cart > 0 items and click it
    const clearCartBtn = await screen.findByTestId('clear-cart-button');
    expect(clearCartBtn).toBeTruthy();

    await userEvent.click(clearCartBtn);
    await screen.findByTestId('cart');

    // Check confirmBtn exists in popover and click it
    const confirmBtn = await screen.findByTestId('clear-all-cart-items-confirm-button');
    expect(confirmBtn).toBeTruthy();
    await userEvent.click(confirmBtn);

    // Check number of datasets and files are now 0
    expect(numDatasetsField.textContent).toEqual('Total Number of Datasets: 0');
    expect(numFilesText.textContent).toEqual('Total Number of Files: 0');

    // Check empty alert renders
    const emptyAlert = await screen.findByText('Your cart is empty');
    expect(emptyAlert).toBeTruthy();
  });

  it('resets cart totals and selections to 0 when all items are removed', async () => {
    RecoilWrapper.modifyAtomValue(userCartAtom.key, []);
    customRender(<App searchQuery={activeSearch} />);

    // Wait for components to rerender
    await screen.findByText('results found for', { exact: false });

    // Check first row has add button and click it
    const addBtn = await screen.findByTestId('row-1-add-to-cart');
    expect(addBtn).toBeTruthy();
    await userEvent.click(addBtn);

    // Check second row has add button and click it
    const addBtn2 = await screen.findByTestId('row-2-add-to-cart');
    expect(addBtn2).toBeTruthy();
    await userEvent.click(addBtn2);

    // Check 'Added item(s) to your cart' message appears
    const addText = await screen.findByText('Added item(s) to your cart');
    expect(addText).toBeTruthy();

    // Check applicable components render
    const rightMenuComponent = await screen.findByTestId('right-menu');
    expect(rightMenuComponent).toBeTruthy();

    // Click on the cart link
    const cartLink = await within(rightMenuComponent).findByRole('img', {
      name: 'shopping-cart',
    });
    expect(cartLink).toBeTruthy();
    await userEvent.click(cartLink);

    // Check number of files and datasets are correctly displayed
    const cartSummary = await screen.findByTestId('summary');
    expect(cartSummary).toBeTruthy();

    const numDatasetsField = await within(cartSummary).findByText('Total Number of Datasets:');
    const numFilesText = await within(cartSummary).findByText('Total Number of Files:');
    expect(numDatasetsField.textContent).toEqual('Total Number of Datasets: 2');
    expect(numFilesText.textContent).toEqual('Total Number of Files: 5');
    const numSelectedDatasetsField = await within(cartSummary).findByText(
      'Selected Number of Datasets:'
    );
    const numSelectedFilesText = await within(cartSummary).findByText('Selected Number of Files:');

    // Check selected number of files and datasets are correctly displayed
    expect(numSelectedDatasetsField.textContent).toEqual('Selected Number of Datasets: 2');
    expect(numSelectedFilesText.textContent).toEqual('Selected Number of Files: 5');

    // Check "Remove All Items" button renders with cart > 0 items and click it
    const clearCartBtn = await screen.findByTestId('clear-cart-button');
    expect(clearCartBtn).toBeTruthy();
    await userEvent.click(clearCartBtn);

    // Check confirmBtn exists in popover and click it
    const confirmBtn = await screen.findByTestId('clear-all-cart-items-confirm-button');
    expect(confirmBtn).toBeTruthy();
    await userEvent.click(confirmBtn);

    // Check number of datasets and files are now 0
    expect(numDatasetsField.textContent).toEqual('Total Number of Datasets: 0');
    expect(numFilesText.textContent).toEqual('Total Number of Files: 0');
    expect(numSelectedDatasetsField.textContent).toEqual('Selected Number of Datasets: 0');
    expect(numSelectedFilesText.textContent).toEqual('Selected Number of Files: 0');

    // Check empty alert renders
    const emptyAlert = await screen.findByText('Your cart is empty');
    expect(emptyAlert).toBeTruthy();
  });
});

describe('Error handling', () => {
  it('displays error message after failing to fetch authenticated user"s cart', async () => {
    server.use(
      rest.get(apiRoutes.userCart.path, (_req, res, ctx) => res(ctx.status(404))),
      rest.post(apiRoutes.userCart.path, (_req, res, ctx) => res(ctx.status(404)))
    );

    customRender(<App searchQuery={activeSearch} />, {
      usesRecoil: true,
      options: {
        token: 'token',
      },
    });

    // Check applicable components render
    const navComponent = await screen.findByTestId('nav-bar');
    expect(navComponent).toBeTruthy();

    // Check error message renders after failing to fetch cart from API
    const errorMsg = await screen.findByText(apiRoutes.userCart.handleErrorMsg(404));
    expect(errorMsg).toBeTruthy();
  });
});

describe('User search library', () => {
  it('handles authenticated user saving and applying searches', async () => {
    customRender(<App searchQuery={activeSearch} />, {
      usesRecoil: true,
      options: {
        token: 'token',
      },
    });

    // Wait for components to rerender
    await screen.findByTestId('main-query-string-label');

    // Check applicable components render
    const rightMenuComponent = await screen.findByTestId('right-menu');
    expect(rightMenuComponent).toBeTruthy();

    // Check Save Search button exists and click it
    const saveSearch = await screen.findByTestId('save-search-btn');
    expect(saveSearch).toBeTruthy();

    await userEvent.click(saveSearch);

    // Click Save Search button again to check if duplicates are saved
    await delay(500);

    await userEvent.click(saveSearch);

    // Click on the search library link
    const searchLibraryLink = await within(rightMenuComponent).findByRole('img', {
      name: 'file-search',
    });
    expect(searchLibraryLink).toBeTruthy();

    await userEvent.click(searchLibraryLink);

    // Check cart renders
    const cart = await screen.findByTestId('cart');
    expect(cart).toBeTruthy();

    // Check apply search button renders and click it
    const applySearchBtn = await screen.findByTestId('apply-1');
    expect(applySearchBtn).toBeTruthy();

    await userEvent.click(applySearchBtn);

    // Wait for components to rerender
    await screen.findByTestId('search');
  });

  it('handles authenticated user removing searches from the search library', async () => {
    customRender(<App searchQuery={activeSearch} />, {
      usesRecoil: true,
      options: {
        token: 'token',
      },
    });

    // Check applicable components render
    const navComponent = await screen.findByTestId('nav-bar');
    expect(navComponent).toBeTruthy();
    const leftMenuComponent = await screen.findByTestId('left-menu');
    expect(leftMenuComponent).toBeTruthy();
    const rightMenuComponent = await screen.findByTestId('right-menu');
    expect(rightMenuComponent).toBeTruthy();

    // Go directly to the search library since user already has items in their cart
    const searchLibraryLink = await within(rightMenuComponent).findByRole('img', {
      name: 'file-search',
    });
    expect(searchLibraryLink).toBeTruthy();

    await userEvent.click(searchLibraryLink);

    // Check number of files and datasets are correctly displayed
    const cart = await screen.findByTestId('cart');
    expect(cart).toBeTruthy();

    // Check there is a saved search card
    const savedSearches = await screen.findByTestId('saved-search-library');
    expect(savedSearches).toBeTruthy();
    expect(within(savedSearches).getByText('Search #', { exact: false })).toBeTruthy();

    // Check delete button renders for the saved search and click it
    const deleteBtn = await screen.findByRole('img', {
      name: 'delete',
      hidden: true,
    });
    expect(deleteBtn).toBeTruthy();

    await userEvent.click(deleteBtn);
    await screen.findByTestId('cart');

    // Check removed message appears
    const removeText = await screen.findByText('Your search library is empty');
    expect(removeText).toBeTruthy();
  });

  it('handles anonymous user saving and applying searches', async () => {
    // Render component as anonymous
    customRender(<App searchQuery={activeSearch} />, { authenticated: false });

    // Check applicable components render
    const leftMenuComponent = await screen.findByTestId('left-menu');

    expect(leftMenuComponent).toBeTruthy();
    const rightMenuComponent = await screen.findByTestId('right-menu');
    expect(rightMenuComponent).toBeTruthy();

    // Wait for components to rerender
    await screen.findByTestId('search');

    // Check Save Search button exists and click it
    const saveSearch = await screen.findByTestId('save-search-btn');
    expect(saveSearch).toBeTruthy();

    await userEvent.click(saveSearch);

    // Click on the search library link
    const searchLibraryLink = await within(rightMenuComponent).findByRole('img', {
      name: 'file-search',
    });
    expect(searchLibraryLink).toBeTruthy();

    await userEvent.click(searchLibraryLink);

    // Check cart renders
    const cart = await screen.findByTestId('cart');
    expect(cart).toBeTruthy();

    // Check apply search button renders and click it
    const applySearchBtn = (
      await within(cart).findAllByRole('img', {
        name: 'search',
      })
    )[0];
    expect(applySearchBtn).toBeTruthy();

    await userEvent.click(applySearchBtn);

    // Wait for components to rerender
    await screen.findByTestId('search-facets');
  });

  it('handles anonymous user removing searches from the search library', async () => {
    // Render component as anonymous
    customRender(<App searchQuery={activeSearch} />, { authenticated: false });

    // Wait for components to rerender
    await screen.findByTestId('main-query-string-label');

    // Check applicable components render
    const rightMenuComponent = await screen.findByTestId('right-menu');
    expect(rightMenuComponent).toBeTruthy();

    // Check Save Search button exists and click it
    const saveSearch = await screen.findByTestId('save-search-btn');
    expect(saveSearch).toBeTruthy();

    await userEvent.click(saveSearch);

    const searchLibraryLink = await within(rightMenuComponent).findByRole('img', {
      name: 'file-search',
      hidden: true,
    });

    expect(searchLibraryLink).toBeTruthy();

    await userEvent.click(searchLibraryLink);

    const cart = await screen.findByTestId('cart');
    expect(cart).toBeTruthy();

    // Check delete button renders for the saved search and click it
    const deleteBtn = await screen.findByTestId('remove-1');
    expect(deleteBtn).toBeTruthy();

    await userEvent.click(deleteBtn);

    await screen.findByTestId('cart');
  });

  it('handles anonymous user copying search to clipboard', async () => {
    customRender(<App searchQuery={activeSearch} />, { authenticated: false });

    // Check applicable components render
    const rightMenuComponent = await screen.findByTestId('right-menu');
    expect(rightMenuComponent).toBeTruthy();

    // Change value for free-text input
    await submitKeywordSearch('foo', user);

    // Wait for components to rerender
    await screen.findByTestId('search');

    // Check Save Search button exists and click it
    const copySearch = await screen.findByTestId('share-search-btn');
    expect(copySearch).toBeTruthy();

    await userEvent.click(copySearch);
  });

  describe('Error handling', () => {
    it('displays error message after failing to fetch authenticated user"s saved search queries', async () => {
      server.use(rest.get(apiRoutes.userSearches.path, (_req, res, ctx) => res(ctx.status(404))));

      customRender(<App searchQuery={activeSearch} />);

      // Check applicable components render
      const navComponent = await screen.findByTestId('nav-bar');
      expect(navComponent).toBeTruthy();

      // Check error message renders after failing to fetch cart from API
      const errorMsg = await screen.findByText(apiRoutes.userSearches.handleErrorMsg(404));
      expect(errorMsg).toBeTruthy();
    });

    it('shows a disabled save search button due to failed search results', async () => {
      customRender(<App searchQuery={activeSearch} />, {
        usesRecoil: true,
        options: {
          token: 'token',
        },
      });

      server.use(rest.post(apiRoutes.userSearches.path, (_req, res, ctx) => res(ctx.status(404))));

      // Wait for components to rerender
      await screen.findByTestId('main-query-string-label');

      // Check Save Search button exists and click it
      const saveSearch = await screen.findByTestId('save-search-btn');
      expect(saveSearch).toBeTruthy();

      await userEvent.click(saveSearch);
    });

    it('displays error message after failing to remove authenticated user"s saved search', async () => {
      // Override API response with 404
      server.use(rest.delete(apiRoutes.userSearch.path, (_req, res, ctx) => res(ctx.status(404))));

      customRender(<App searchQuery={activeSearch} />, {
        usesRecoil: true,
        options: { token: 'token' },
      });

      // Check delete button renders for the saved search and click it
      const saveBtn = await screen.findByText('Save Search');
      expect(saveBtn).toBeTruthy();
      userEvent.click(saveBtn);

      // Check applicable components render
      const rightMenuComponent = await screen.findByTestId('right-menu');
      expect(rightMenuComponent).toBeTruthy();

      // Go to the search library
      const searchLibraryLink = await within(rightMenuComponent).findByRole('img', {
        name: 'file-search',
        hidden: true,
      });
      expect(searchLibraryLink).toBeTruthy();
      await userEvent.click(searchLibraryLink);

      // Check cart component renders
      const cartComponent = await screen.findByTestId('cart');
      expect(cartComponent).toBeTruthy();

      // Check delete button renders for a saved search and click it
      const deleteBtn = (
        await within(cartComponent).findAllByRole('img', {
          name: 'delete',
          hidden: true,
        })
      )[0];
      expect(deleteBtn).toBeTruthy();

      await userEvent.click(deleteBtn);

      const errorMsg = await screen.findAllByText(apiRoutes.userSearch.handleErrorMsg(404));
      expect(errorMsg).toBeTruthy();
    });
  });
});

describe('User support', () => {
  it('renders user support modal when clicking help button and is closeable', async () => {
    customRender(<App searchQuery={activeSearch} />);

    // support button renders
    const supportBtn = await screen.findByRole('img', { name: 'question' });
    expect(supportBtn).toBeTruthy();

    // click support button
    await userEvent.click(supportBtn);

    // GitHub icon renders
    const metagridSupportHeader = await screen.findByText(' MetaGrid Support', {
      exact: false,
    });
    expect(metagridSupportHeader).toBeTruthy();

    // click close button
    const closeBtn = await screen.findByText('Close Support');

    await userEvent.click(closeBtn);
  });
});

describe('Data node status page', () => {
  it('renders the node status page after clicking the link', async () => {
    customRender(<App searchQuery={activeSearch} />);

    const rightMenuComponent = await screen.findByTestId('right-menu');
    expect(rightMenuComponent).toBeTruthy();

    const nodeLink = await within(rightMenuComponent).findByRole('link', {
      name: 'node-index Node Status',
    });
    expect(nodeLink).toBeTruthy();

    await userEvent.click(nodeLink);

    const nodeStatusPage = await screen.findByTestId('node-status');
    expect(nodeStatusPage).toBeTruthy();
  });
});

describe('Theme switch', () => {
  it('switches to dark mode', async () => {
    customRender(<App searchQuery={activeSearch} />);

    // Check applicable components render
    const navComponent = await screen.findByTestId('nav-bar');
    expect(navComponent).toBeTruthy();

    // Find and click the theme switch button
    const rightMenuComponent = await screen.findByTestId('right-menu');
    expect(rightMenuComponent).toBeTruthy();
    const themeSwitch = await within(rightMenuComponent).findByTestId('isDarkModeSwitch');
    expect(themeSwitch).toBeTruthy();

    await userEvent.click(themeSwitch);

    // Check if the dark mode class is applied
    expect(navComponent).toHaveClass('dark-mode');
  });

  it('switches to light mode', async () => {
    customRender(<App searchQuery={activeSearch} />);

    // Check applicable components render
    const navComponent = await screen.findByTestId('nav-bar');
    expect(navComponent).toBeTruthy();

    // Find and click the theme switch button to switch to dark mode first
    const rightMenuComponent = await screen.findByTestId('right-menu');
    expect(rightMenuComponent).toBeTruthy();
    const themeSwitch = await within(rightMenuComponent).findByTestId('isDarkModeSwitch');
    expect(themeSwitch).toBeTruthy();

    await userEvent.click(themeSwitch);

    // Find and click the theme switch button again to switch back to light mode
    await userEvent.click(themeSwitch);

    // Check if the light mode class is applied
    expect(navComponent).not.toHaveClass('dark-mode');
  });
});
