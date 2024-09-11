/**
 * This file contains tests for the App component.
 *
 * The App component uses React Router and React Context, so it must be wrapped
 * in order to mock their behaviors.
 *
 */
import {
  act,
  fireEvent,
  waitFor,
  within,
  screen,
} from '@testing-library/react';
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
  getRowName,
  mockKeycloakToken,
  submitKeywordSearch,
} from '../../test/jestTestFunctions';

const user = userEvent.setup();

jest.mock('@react-keycloak/web', () => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const originalModule = jest.requireActual('@react-keycloak/web');

  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return {
    ...originalModule,
    useKeycloak: () => {
      return mockKeycloakToken();
    },
  };
});

jest.setTimeout(60000); // Some tests require more time to run

describe('test main components', () => {
  it('renders App component', async () => {
    // const { getByTestId, findByTestId } = customRender(
    //   <App searchQuery={activeSearch} />
    // );

    customRender(<App searchQuery={activeSearch} />);

    // Check applicable components render
    const navComponent = await screen.findByTestId('nav-bar');
    expect(navComponent).toBeTruthy();
    const facetsComponent = await screen.findByTestId('search-facets');
    expect(facetsComponent).toBeTruthy();
    expect(await screen.findByTestId('search')).toBeTruthy();
  });

  it('renders App component with undefined search query', async () => {
    customRender(
      <App searchQuery={(undefined as unknown) as ActiveSearchQuery} />
    );

    // Check applicable components render
    const navComponent = await waitFor(() => screen.findByTestId('nav-bar'));
    expect(navComponent).toBeTruthy();
    const facetsComponent = await waitFor(() =>
      screen.findByTestId('search-facets')
    );
    expect(facetsComponent).toBeTruthy();
    expect(await screen.findByTestId('search')).toBeTruthy();
  });

  it('renders App component with project only search query', async () => {
    customRender(<App searchQuery={getSearchFromUrl('?project=CMIP5')} />);

    // Check applicable components render
    const navComponent = await waitFor(() => screen.findByTestId('nav-bar'));
    expect(navComponent).toBeTruthy();
    const facetsComponent = await waitFor(() =>
      screen.findByTestId('search-facets')
    );
    expect(facetsComponent).toBeTruthy();
    expect(await screen.findByTestId('search')).toBeTruthy();
  });

  it('shows duplicate error when search keyword is typed in twice', async () => {
    customRender(<App searchQuery={activeSearch} />);
    // const { getByText } = renderedApp;

    const input = 'foo';
    await submitKeywordSearch(input, user);

    // Change the value for free-text input to 'foo' again and submit
    await submitKeywordSearch(input, user);

    // Check error message appears that input has already been applied
    const errorMsg = await waitFor(() =>
      screen.findByText(`Input "${input}" has already been applied`)
    );
    expect(errorMsg).toBeTruthy();
  });

  it('handles setting filename searches and duplicates', async () => {
    customRender(<App searchQuery={activeSearch} />);
    // const { getByTestId, getByText } = renderedApp;

    // Check applicable components render
    const leftSearchColumn = await waitFor(() =>
      screen.findByTestId('search-facets')
    );
    expect(leftSearchColumn).toBeTruthy();

    // Wait for components to rerender
    await waitFor(() => screen.findByTestId('search'));
    await waitFor(() => screen.getByTestId('facets-form'));

    const facetsForm = await waitFor(() => screen.findByTestId('facets-form'));
    expect(facetsForm).toBeTruthy();

    // Check error message appears that input has already been applied
    const input = 'var';

    // Open filename collapse panel
    const filenameSearchPanel = await within(facetsForm).findByRole('button', {
      name: 'collapsed Filename',
    });

    await act(async () => {
      await user.click(filenameSearchPanel);
    });

    // Change form field values
    const inputField = await screen.findByTestId('filename-search-input');

    await act(async () => {
      await user.type(inputField, input);
    });

    // Submit the form
    const filenameVarsSubmitBtn = await within(facetsForm).findByRole(
      'button',
      {
        name: 'search',
      }
    );
    await act(async () => {
      await user.click(filenameVarsSubmitBtn);
    });

    // Wait for components to rerender
    await waitFor(() => screen.findByTestId('search'));

    await act(async () => {
      await user.type(inputField, input);
    });
    await act(async () => {
      await user.click(filenameVarsSubmitBtn);
    });

    // Wait for components to rerender
    await waitFor(() => screen.findByTestId('search'));

    // Check error message appears that input has already been applied
    const errorMsg = await waitFor(() =>
      screen.findByText(`Input "${input}" has already been applied`)
    );
    expect(errorMsg).toBeTruthy();
  });

  it('handles setting and removing text input filters and clearing all search filters', async () => {
    customRender(<App searchQuery={activeSearch} />);

    // const { getByTestId, getByText } = renderedApp;

    // Change value for free-text input
    await submitKeywordSearch('foo', user);

    // Check tag renders
    const tag = await waitFor(() => screen.findByTestId('foo'));
    expect(tag).toBeTruthy();

    // Click on the ClearAllTag
    const clearAllTag = await waitFor(() => screen.findByText('Clear All'));
    expect(clearAllTag).toBeTruthy();

    await act(async () => {
      await user.click(clearAllTag);
    });

    // Change value for free-text input and submit again
    await submitKeywordSearch('baz', user);

    // Wait for components to rerender
    await waitFor(() => screen.findByTestId('search'));

    // Check baz tag exists
    const bazTag = await waitFor(() => screen.findByTestId('baz'));
    expect(bazTag).toBeTruthy();

    // Close the baz tag
    await act(async () => {
      await user.click(within(bazTag).getByRole('img', { name: 'close' }));
    });

    // Wait for components to rerender
    await waitFor(() => screen.findByTestId('search'));
  });

  it('handles applying general facets', async () => {
    customRender(<App searchQuery={activeSearch} />);

    // Wait for facets forms to rerender
    const facetsForm = await waitFor(() => screen.findByTestId('facets-form'));
    expect(facetsForm).toBeTruthy();

    // Open additional properties collapse panel
    const additionalPropertiesPanel = await within(facetsForm).findByRole(
      'button',
      {
        name: 'expanded Additional Properties',
      }
    );
    await act(async () => {
      await user.click(additionalPropertiesPanel);
    });

    // Check facet select form exists and mouseDown to expand list of options
    const resultTypeSelect = await screen.findByTestId(
      'result-type-form-select'
    );
    expect(resultTypeSelect).toBeTruthy();
    fireEvent.mouseDown(resultTypeSelect.firstElementChild as HTMLInputElement);

    // Select the first facet option
    const resultTypeOption = await waitFor(() =>
      screen.findByText('Originals only')
    );
    expect(resultTypeOption).toBeTruthy();

    await act(async () => {
      await user.click(resultTypeOption);
    });
    await waitFor(() => screen.findByTestId('facets-form'));

    await waitFor(() => screen.findByTestId('search'));
  });

  it('handles applying and removing project facets', async () => {
    customRender(<App searchQuery={activeSearch} />);

    // Check applicable components render
    const facetsComponent = await waitFor(() =>
      screen.findByTestId('search-facets')
    );
    expect(facetsComponent).toBeTruthy();

    // Wait for project form to render
    const facetsForm = await waitFor(() => screen.findByTestId('facets-form'));
    expect(facetsForm).toBeTruthy();

    // Open top collapse panel
    const group1Panel = await within(facetsComponent).findByRole('button', {
      name: 'collapsed Group1',
    });

    await act(async () => {
      await user.click(group1Panel);
    });

    // Open Collapse Panel in Collapse component for the data_node form to render
    const collapse = await screen.findByText('Data Node');

    await act(async () => {
      await user.click(collapse);
    });

    // Check facet select form exists and mouseDown to expand list of options
    const facetFormSelect = await screen.findByTestId('data_node-form-select');
    expect(facetFormSelect).toBeTruthy();
    fireEvent.mouseDown(facetFormSelect.firstElementChild as HTMLInputElement);

    // Select the first facet option
    const facetOption = await waitFor(() =>
      screen.findByTestId('data_node_aims3.llnl.gov')
    );
    expect(facetOption).toBeTruthy();
    await act(async () => {
      await user.click(facetOption);
    });

    // Apply facets
    fireEvent.keyDown(facetFormSelect, {
      key: 'Escape',
      code: 'Escape',
      keyCode: '27',
      charCode: '27',
    });

    // Wait for components to rerender
    await waitFor(() => screen.findByTestId('search'));

    // Check facet option applied
    const tag = await waitFor(() => screen.findByTestId('aims3.llnl.gov'));
    expect(tag).toBeTruthy();

    // Check facets select form rerenders and mouseDown to expand list of options
    const facetFormSelectRerender = await screen.findByTestId(
      'data_node-form-select'
    );
    expect(facetFormSelectRerender).toBeTruthy();
    fireEvent.mouseDown(
      facetFormSelectRerender.firstElementChild as HTMLInputElement
    );

    // Check option is selected and remove it
    const facetOptionRerender = await waitFor(() =>
      within(facetFormSelectRerender).findByRole('img', {
        name: 'close',
        hidden: true,
      })
    );
    expect(facetOptionRerender).toBeTruthy();

    await act(async () => {
      await user.click(facetOptionRerender);
    });

    // Remove facets
    fireEvent.keyDown(facetFormSelectRerender, {
      key: 'Escape',
      code: 'Escape',
      keyCode: '27',
      charCode: '27',
    });

    // Wait for component to rerender
    await waitFor(() => screen.findByTestId('search'));
  });

  it('fetches the data node status every defined interval', async () => {
    jest.useFakeTimers();

    customRender(<App searchQuery={activeSearch} />);

    act(() => {
      jest.advanceTimersByTime(295000);
      jest.useRealTimers();
    });

    // Check applicable components render
    const facetsComponent = await waitFor(() =>
      screen.findByTestId('search-facets')
    );
    expect(facetsComponent).toBeTruthy();
  });
});

describe('User cart', () => {
  jest.setTimeout(45000);
  it('handles authenticated user adding and removing items from cart', async () => {
    customRender(<App searchQuery={activeSearch} />);
    // const { getByRole, getByText } = renderedApp;

    // Wait for components to rerender
    await waitFor(() => screen.findByText('Query String:', { exact: false }));

    // Check first row exists
    const firstRow = await screen.findByRole('row', {
      name: getRowName('plus', 'close', 'bar', '2', '1', '1'),
    });
    expect(firstRow).toBeTruthy();

    // Check first row has add button and click it
    const addBtn = await within(firstRow).findByRole('img', { name: 'plus' });
    expect(addBtn).toBeTruthy();

    await act(async () => {
      await user.click(addBtn);
    });

    // Check 'Added items(s) to the cart' message appears
    const addText = await waitFor(() =>
      screen.findByText('Added item(s) to your cart')
    );
    expect(addText).toBeTruthy();

    // Check first row has remove button and click it
    const removeBtn = within(firstRow).getByRole('img', { name: 'minus' });
    expect(removeBtn).toBeTruthy();

    await act(async () => {
      await user.click(removeBtn);
    });

    // Check 'Removed items(s) from the cart' message appears
    const removeText = await waitFor(() =>
      screen.findByText('Removed item(s) from your cart')
    );
    expect(removeText).toBeTruthy();
  });

  it("displays authenticated user's number of files in the cart summary and handles clearing the cart", async () => {
    customRender(<App searchQuery={activeSearch} />);
    // const { getByRole, getByText, getByTestId, findByText } = renderedApp;

    // Wait for components to rerender
    await waitFor(() => screen.findByText('Query String:', { exact: false }));

    // Check first row exists
    const firstRow = await screen.findByRole('row', {
      name: getRowName('plus', 'close', 'bar', '2', '1', '1'),
    });
    expect(firstRow).toBeTruthy();

    // Check first row has add button and click it
    const addBtn = await within(firstRow).findByRole('img', { name: 'plus' });
    expect(addBtn).toBeTruthy();

    await act(async () => {
      await user.click(addBtn);
    });

    // Check 'Added items(s) to the cart' message appears
    const addText = await waitFor(() =>
      screen.findByText('Added item(s) to your cart')
    );
    expect(addText).toBeTruthy();

    // Check applicable components render
    const rightMenuComponent = await waitFor(() =>
      screen.findByTestId('right-menu')
    );
    expect(rightMenuComponent).toBeTruthy();

    // Click on the cart link
    const cartLink = await within(rightMenuComponent).findByRole('img', {
      name: 'shopping-cart',
    });
    expect(cartLink).toBeTruthy();

    await act(async () => {
      await user.click(cartLink);
    });

    // Check number of files and datasets are correctly displayed
    const cart = await waitFor(() => screen.findByTestId('cart'));
    expect(cart).toBeTruthy();
    const cartSummary = await waitFor(() => screen.findByTestId('summary'));
    expect(cartSummary).toBeTruthy();

    const numDatasetsField = await waitFor(() =>
      within(cartSummary).findByText('Number of Datasets:')
    );
    const numFilesText = await waitFor(() =>
      within(cartSummary).findByText('Number of Files:')
    );

    expect(numDatasetsField.textContent).toEqual('Number of Datasets: 1');
    expect(numFilesText.textContent).toEqual('Number of Files: 2');

    // Check "Remove All Items" button renders with cart > 0 items and click it
    const clearCartBtn = within(cart).getByRole('button', {
      name: 'Remove All Items',
    });
    expect(clearCartBtn).toBeTruthy();

    await act(async () => {
      await user.click(clearCartBtn);
    });

    await waitFor(() => screen.findByTestId('cart'));

    // Check confirmBtn exists in popover and click it
    const confirmBtn = await screen.findByRole('button', {
      name: 'OK',
    });
    expect(confirmBtn).toBeTruthy();
    await act(async () => {
      await user.click(confirmBtn);
    });

    // Check number of datasets and files are now 0
    expect(numDatasetsField.textContent).toEqual('Number of Datasets: 0');
    expect(numFilesText.textContent).toEqual('Number of Files: 0');

    // Check empty alert renders
    const emptyAlert = await screen.findByText('Your cart is empty');
    expect(emptyAlert).toBeTruthy();
  });

  it('handles anonymous user adding and removing items from cart', async () => {
    // Render component as anonymous
    customRender(<App searchQuery={activeSearch} />, {}, false);

    // const { getByRole, getByText } = renderedApp;

    // Wait for components to rerender
    await waitFor(() => screen.findByText('Query String:', { exact: false }));

    // Check first row exists
    const firstRow = await screen.findByRole('row', {
      name: getRowName('plus', 'check', 'foo', '3', '1', '1'),
    });
    expect(firstRow).toBeTruthy();

    // Check first row has add button and click it
    const addBtn = within(firstRow).getByRole('img', { name: 'plus' });
    expect(addBtn).toBeTruthy();

    await act(async () => {
      await user.click(addBtn);
    });

    // Check first row has remove button and click it
    const removeBtn = within(firstRow).getByRole('img', { name: 'minus' });
    expect(removeBtn).toBeTruthy();

    await act(async () => {
      await user.click(removeBtn);
    });
  });

  it.only('displays anonymous user"s number of files in the cart summary and handles clearing the cart', async () => {
    customRender(<App searchQuery={activeSearch} />, {}, false);

    // Wait for components to rerender
    await screen.findByText('Query String:', { exact: false });

    // Check first row exists
    const firstRow = await screen.findByRole('row', {
      name: getRowName('plus', 'close', 'bar', '2', '1', '1'),
    });
    expect(firstRow).toBeTruthy();

    // Check first row has add button and click it
    const addBtn = await within(firstRow).findByRole('img', { name: 'plus' });
    expect(addBtn).toBeTruthy();

    await act(async () => {
      await user.click(addBtn);
    });

    // Check 'Added items(s) to the cart' message appears
    const addText = await waitFor(() =>
      screen.findByText('Added item(s) to your cart')
    );
    expect(addText).toBeTruthy();

    // Check applicable components render
    const rightMenuComponent = await screen.findByTestId('right-menu');
    expect(rightMenuComponent).toBeTruthy();

    // Click on the cart link
    const cartLink = await within(rightMenuComponent).findByRole('img', {
      name: 'shopping-cart',
    });
    expect(cartLink).toBeTruthy();

    await act(async () => {
      await user.click(cartLink);
    });

    // Check number of files and datasets are correctly displayed
    const cart = await screen.findByTestId('cart');
    expect(cart).toBeTruthy();
    const cartSummary = await screen.findByTestId('summary');
    expect(cartSummary).toBeTruthy();

    const numDatasetsField = await within(cartSummary).findByText(
      'Number of Datasets:'
    );
    const numFilesText = await within(cartSummary).findByText(
      'Number of Files:'
    );
    expect(numDatasetsField.textContent).toEqual('Number of Datasets: 1');
    expect(numFilesText.textContent).toEqual('Number of Files: 2');

    // Check "Remove All Items" button renders with cart > 0 items and click it
    const clearCartBtn = await within(cart).findByRole('button', {
      name: 'Remove All Items',
    });
    expect(clearCartBtn).toBeTruthy();

    await act(async () => {
      await user.click(clearCartBtn);
    });

    await screen.findByTestId('cart');

    // Check confirmBtn exists in popover and click it
    const confirmBtn = await screen.findByRole('button', {
      name: 'OK',
    });
    expect(confirmBtn).toBeTruthy();
    await act(async () => {
      await user.click(confirmBtn);
    });

    // Check number of datasets and files are now 0
    expect(numDatasetsField.textContent).toEqual('Number of Datasets: 0');
    expect(numFilesText.textContent).toEqual('Number of Files: 0');

    // Check empty alert renders
    const emptyAlert = await screen.findByText('Your cart is empty');
    expect(emptyAlert).toBeTruthy();
  });

  describe('Error handling', () => {
    it('displays error message after failing to fetch authenticated user"s cart', async () => {
      server.use(
        rest.get(apiRoutes.userCart.path, (_req, res, ctx) =>
          res(ctx.status(404))
        ),
        rest.post(apiRoutes.userCart.path, (_req, res, ctx) =>
          res(ctx.status(404))
        )
      );

      customRender(<App searchQuery={activeSearch} />, {
        token: 'token',
      });

      // Check applicable components render
      const navComponent = await waitFor(() => screen.findByTestId('nav-bar'));
      expect(navComponent).toBeTruthy();

      // Check error message renders after failing to fetch cart from API
      const errorMsg = await waitFor(() =>
        screen.findByText(apiRoutes.userCart.handleErrorMsg(404))
      );
      expect(errorMsg).toBeTruthy();
    });
  });
});

describe('User search library', () => {
  it('handles authenticated user saving and applying searches', async () => {
    customRender(<App searchQuery={activeSearch} />, {
      token: 'token',
    });

    // Wait for components to rerender
    await waitFor(() => screen.findByText('Query String:', { exact: false }));

    // Check applicable components render
    const rightMenuComponent = await waitFor(() =>
      screen.findByTestId('right-menu')
    );
    expect(rightMenuComponent).toBeTruthy();

    // Check Save Search button exists and click it
    const saveSearch = await screen.findByRole('button', {
      name: 'book Save Search',
    });
    expect(saveSearch).toBeTruthy();

    await act(async () => {
      await user.click(saveSearch);
    });

    // Click Save Search button again to check if duplicates are saved
    await act(async () => {
      await delay(500);
    });

    await act(async () => {
      await user.click(saveSearch);
    });

    // Click on the search library link
    const searchLibraryLink = await within(rightMenuComponent).findByRole(
      'img',
      { name: 'file-search' }
    );
    expect(searchLibraryLink).toBeTruthy();

    await act(async () => {
      await user.click(searchLibraryLink);
    });

    // Check cart renders
    const cart = await screen.findByTestId('cart');
    expect(cart).toBeTruthy();

    // Check apply search button renders and click it
    const applySearchBtn = await screen.findByTestId('apply-1');
    expect(applySearchBtn).toBeTruthy();

    await act(async () => {
      await user.click(applySearchBtn);
    });

    // Wait for components to rerender
    await screen.findByTestId('search');
  });

  it('handles authenticated user removing searches from the search library', async () => {
    customRender(<App searchQuery={activeSearch} />, {
      token: 'token',
    });

    // Check applicable components render
    const navComponent = await waitFor(() => screen.findByTestId('nav-bar'));
    expect(navComponent).toBeTruthy();
    const leftMenuComponent = await waitFor(() =>
      screen.findByTestId('left-menu')
    );
    expect(leftMenuComponent).toBeTruthy();
    const rightMenuComponent = await waitFor(() =>
      screen.findByTestId('right-menu')
    );
    expect(rightMenuComponent).toBeTruthy();

    // Go directly to the search library since user already has items in their cart
    const searchLibraryLink = await waitFor(() =>
      within(rightMenuComponent).findByRole('img', { name: 'file-search' })
    );
    expect(searchLibraryLink).toBeTruthy();

    await act(async () => {
      await user.click(searchLibraryLink);
    });

    // Check number of files and datasets are correctly displayed
    const cart = await waitFor(() => screen.findByTestId('cart'));
    expect(cart).toBeTruthy();

    // Check delete button renders for the saved search and click it
    const deleteBtn = await waitFor(() =>
      screen.findByRole('img', { name: 'delete', hidden: true })
    );
    expect(deleteBtn).toBeTruthy();

    await act(async () => {
      await user.click(deleteBtn);
    });

    await waitFor(() => screen.findByTestId('cart'));

    // Check removed message appears
    const removeText = await waitFor(() =>
      screen.findByText('Removed search query from your library')
    );
    expect(removeText).toBeTruthy();
  });

  it('handles anonymous user saving and applying searches', async () => {
    // Render component as anonymous
    customRender(<App searchQuery={activeSearch} />, {}, true);

    // Check applicable components render
    const leftMenuComponent = await screen.findByTestId('left-menu');

    expect(leftMenuComponent).toBeTruthy();
    const rightMenuComponent = await screen.findByTestId('right-menu');
    expect(rightMenuComponent).toBeTruthy();

    // Wait for components to rerender
    await screen.findByTestId('search');

    // Check Save Search button exists and click it
    const saveSearch = await screen.findByRole('button', {
      name: 'book Save Search',
    });
    expect(saveSearch).toBeTruthy();

    await act(async () => {
      await user.click(saveSearch);
    });

    // Click on the search library link
    const searchLibraryLink = await within(rightMenuComponent).findByRole(
      'img',
      { name: 'file-search' }
    );
    expect(searchLibraryLink).toBeTruthy();

    await act(async () => {
      await user.click(searchLibraryLink);
    });

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

    await act(async () => {
      await user.click(applySearchBtn);
    });

    // Wait for components to rerender
    await screen.findByTestId('search-facets');
  });

  it('handles anonymous user removing searches from the search library', async () => {
    // Render component as anonymous
    customRender(<App searchQuery={activeSearch} />, {}, true);

    // Wait for components to rerender
    await waitFor(() => screen.findByText('Query String:', { exact: false }));

    // Check applicable components render
    const rightMenuComponent = await waitFor(() =>
      screen.findByTestId('right-menu')
    );
    expect(rightMenuComponent).toBeTruthy();

    // Check Save Search button exists and click it
    const saveSearch = await screen.findByRole('button', {
      name: 'book Save Search',
    });
    expect(saveSearch).toBeTruthy();

    await act(async () => {
      await user.click(saveSearch);
    });

    const searchLibraryLink = await within(rightMenuComponent).findByRole(
      'img',
      { name: 'file-search', hidden: true }
    );

    expect(searchLibraryLink).toBeTruthy();

    await act(async () => {
      await user.click(searchLibraryLink);
    });

    const cart = await waitFor(() => screen.findByTestId('cart'));
    expect(cart).toBeTruthy();

    // Check delete button renders for the saved search and click it
    const deleteBtn = await screen.findByTestId('remove-1');
    expect(deleteBtn).toBeTruthy();

    await act(async () => {
      await user.click(deleteBtn);
    });

    await waitFor(() => screen.findByTestId('cart'));
  });

  it('handles anonymous user copying search to clipboard', async () => {
    customRender(<App searchQuery={activeSearch} />, {}, true);

    // Check applicable components render
    const rightMenuComponent = await screen.findByTestId('right-menu');
    expect(rightMenuComponent).toBeTruthy();

    // Change value for free-text input
    await submitKeywordSearch('foo', user);

    // Wait for components to rerender
    await screen.findByTestId('search');

    // Check Save Search button exists and click it
    const copySearch = await screen.findByRole('button', {
      name: 'share-alt Copy Search',
    });
    expect(copySearch).toBeTruthy();

    await act(async () => {
      await user.click(copySearch);
    });
  });

  describe('Error handling', () => {
    it('displays error message after failing to fetch authenticated user"s saved search queries', async () => {
      server.use(
        rest.get(apiRoutes.userSearches.path, (_req, res, ctx) =>
          res(ctx.status(404))
        )
      );

      customRender(<App searchQuery={activeSearch} />);

      // Check applicable components render
      const navComponent = await screen.findByTestId('nav-bar');
      expect(navComponent).toBeTruthy();

      // Check error message renders after failing to fetch cart from API
      const errorMsg = await screen.findByText(
        apiRoutes.userSearches.handleErrorMsg(404)
      );
      expect(errorMsg).toBeTruthy();
    });

    it('shows a disabled save search button due to failed search results', async () => {
      customRender(<App searchQuery={activeSearch} />, {
        token: 'token',
      });

      server.use(
        rest.post(apiRoutes.userSearches.path, (_req, res, ctx) =>
          res(ctx.status(404))
        )
      );

      // Wait for components to rerender
      await screen.findByText('Query String:', { exact: false });

      // Check Save Search button exists and click it
      const saveSearch = await screen.findByRole('button', {
        name: 'book Save Search',
      });
      expect(saveSearch).toBeTruthy();

      await act(async () => {
        await user.click(saveSearch);
      });
    });

    it('displays error message after failing to remove authenticated user"s saved search', async () => {
      // Override API response with 404
      server.use(
        rest.delete(apiRoutes.userSearch.path, (_req, res, ctx) =>
          res(ctx.status(404))
        )
      );

      customRender(<App searchQuery={activeSearch} />, {
        token: 'token',
      });

      // Check delete button renders for the saved search and click it
      const saveBtn = await screen.findByText('Save Search');
      expect(saveBtn).toBeTruthy();
      user.click(saveBtn);

      // Check applicable components render
      const rightMenuComponent = await screen.findByTestId('right-menu');
      expect(rightMenuComponent).toBeTruthy();

      // Go to the search library
      const searchLibraryLink = await within(
        rightMenuComponent
      ).findByRole('img', { name: 'file-search', hidden: true });
      expect(searchLibraryLink).toBeTruthy();
      await act(async () => {
        await user.click(searchLibraryLink);
      });

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

      await act(async () => {
        await user.click(deleteBtn);
      });

      const errorMsg = await screen.findAllByText(
        apiRoutes.userSearch.handleErrorMsg(404)
      );
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
    await act(async () => {
      await user.click(supportBtn);
    });

    // GitHub icon renders
    const metagridSupportHeader = await screen.findByText(' MetaGrid Support', {
      exact: false,
    });
    expect(metagridSupportHeader).toBeTruthy();

    // click close button
    const closeBtn = await screen.findByText('Close Support');

    await act(async () => {
      await user.click(closeBtn);
    });
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

    await act(async () => {
      await user.click(nodeLink);
    });

    const nodeStatusPage = await screen.findByTestId('node-status');
    expect(nodeStatusPage).toBeTruthy();
  });
});
