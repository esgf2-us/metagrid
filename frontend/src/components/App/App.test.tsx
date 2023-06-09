/**
 * This file contains tests for the App component.
 *
 * The App component uses React Router and React Context, so it must be wrapped
 * in order to mock their behaviors.
 *
 */
import {
  act,
  cleanup,
  fireEvent,
  waitFor,
  within,
} from '@testing-library/react';
import React from 'react';
import { rest, server } from '../../api/mock/setup-env';
import apiRoutes from '../../api/routes';
import { delay } from '../../common/reactJoyrideSteps';
import { getSearchFromUrl } from '../../common/utils';
import { customRender, getRowName } from '../../test/custom-render';
import { ActiveSearchQuery } from '../Search/types';
import App from './App';

// Used to restore window.location after each test
const location = JSON.stringify(window.location);

const activeSearch: ActiveSearchQuery = getSearchFromUrl();

afterEach(() => {
  // Routes are already declared in the App component using BrowserRouter, so MemoryRouter does
  // not work to isolate routes in memory between tests. The only workaround is to delete window.location and restore it after each test in order to reset the URL location.
  // https://stackoverflow.com/a/54222110
  // https://stackoverflow.com/questions/59892304/cant-get-memoryrouter-to-work-with-testing-library-react

  // TypeScript complains with error TS2790: The operand of a 'delete' operator must be optional.
  // https://github.com/facebook/jest/issues/890#issuecomment-776112686
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  delete window.location;
  window.location = (JSON.parse(location) as unknown) as Location;

  // Clear localStorage between tests
  localStorage.clear();

  // Reset all mocks after each test
  jest.clearAllMocks();

  cleanup();
});

it('renders App component', async () => {
  const { getByTestId } = customRender(<App searchQuery={activeSearch} />);

  // Check applicable components render
  const navComponent = await waitFor(() => getByTestId('nav-bar'));
  expect(navComponent).toBeTruthy();
  const facetsComponent = await waitFor(() => getByTestId('facets'));
  expect(facetsComponent).toBeTruthy();
  expect(getByTestId('search')).toBeTruthy();
});

it('renders App component with undefined search query', async () => {
  const { getByTestId } = customRender(
    <App searchQuery={(undefined as unknown) as ActiveSearchQuery} />
  );

  // Check applicable components render
  const navComponent = await waitFor(() => getByTestId('nav-bar'));
  expect(navComponent).toBeTruthy();
  const facetsComponent = await waitFor(() => getByTestId('facets'));
  expect(facetsComponent).toBeTruthy();
  expect(getByTestId('search')).toBeTruthy();
});

it('renders App component with project only search query', async () => {
  const { getByTestId } = customRender(
    <App searchQuery={getSearchFromUrl('?project=CMIP5')} />
  );

  // Check applicable components render
  const navComponent = await waitFor(() => getByTestId('nav-bar'));
  expect(navComponent).toBeTruthy();
  const facetsComponent = await waitFor(() => getByTestId('facets'));
  expect(facetsComponent).toBeTruthy();
  expect(getByTestId('search')).toBeTruthy();
});

it('handles project changes when a new project is selected', async () => {
  const { getByPlaceholderText, getByTestId, getByText } = customRender(
    <App searchQuery={activeSearch} />
  );

  // Check applicable components render
  const leftMenuComponent = await waitFor(() => getByTestId('left-menu'));
  expect(leftMenuComponent).toBeTruthy();

  // Change value for free-text input
  const input = 'foo';
  const freeTextForm = await waitFor(() =>
    getByPlaceholderText('Search for a keyword')
  );
  expect(freeTextForm).toBeTruthy();
  fireEvent.change(freeTextForm, { target: { value: input } });

  // Submit the form
  const submitBtn = within(leftMenuComponent).getByRole('img', {
    name: 'search',
  });
  fireEvent.submit(submitBtn);

  // Wait for components to rerender
  await waitFor(() => getByTestId('search'));

  // Change the value for free-text input to 'foo' again and submit
  fireEvent.change(freeTextForm, { target: { value: input } });
  fireEvent.submit(submitBtn);

  // Check error message appears that input has already been applied
  const errorMsg = await waitFor(() =>
    getByText(`Input "${input}" has already been applied`)
  );
  expect(errorMsg).toBeTruthy();
});

it('handles setting filename searches and duplicates', async () => {
  const { getByTestId } = customRender(<App searchQuery={activeSearch} />);
  // Check applicable components render
  const facetsComponent = await waitFor(() => getByTestId('facets'));
  expect(facetsComponent).toBeTruthy();

  // Wait for project form to render
  const projectForm = await waitFor(() => getByTestId('project-form'));
  expect(projectForm).toBeTruthy();

  // Check project select form exists and mouseDown to expand list of options to expand options
  const projectFormSelect = within(projectForm).getByRole('combobox');
  expect(projectFormSelect).toBeTruthy();
  fireEvent.mouseDown(projectFormSelect);

  // Select the second project option
  const projectOption = getByTestId('project_1');
  expect(projectOption).toBeTruthy();
  fireEvent.click(projectOption);

  // Submit the form
  const submitBtn = within(facetsComponent).getByRole('img', {
    name: 'select',
  });
  fireEvent.submit(submitBtn);

  // Wait for components to rerender
  await waitFor(() => getByTestId('search'));
  await waitFor(() => getByTestId('facets'));

  // Open filename collapse panel
  const filenameSearchPanel = within(facetsComponent).getByRole('button', {
    name: 'right Filename',
  });
  fireEvent.click(filenameSearchPanel);

  // Change form field values
  const input = getByTestId('filename-search-input');
  fireEvent.change(input, { target: { value: 'var' } });

  // Submit the form
  const filenameVarsSubmitBtn = within(facetsComponent).getByRole('button', {
    name: 'search',
  });
  fireEvent.submit(filenameVarsSubmitBtn);

  // Wait for components to rerender
  await waitFor(() => getByTestId('search'));

  fireEvent.change(input, { target: { value: 'var' } });
  fireEvent.submit(filenameVarsSubmitBtn);

  // Wait for components to rerender
  await waitFor(() => getByTestId('search'));
});

it('handles setting and removing text input filters and clearing all search filters', async () => {
  const { getByPlaceholderText, getByTestId, getByText } = customRender(
    <App searchQuery={activeSearch} />
  );

  // Check applicable components render
  const leftMenuComponent = await waitFor(() => getByTestId('left-menu'));
  expect(leftMenuComponent).toBeTruthy();

  // Change value for free-text input
  const freeTextInput = await waitFor(() =>
    getByPlaceholderText('Search for a keyword')
  );
  expect(freeTextInput).toBeTruthy();
  fireEvent.change(freeTextInput, { target: { value: 'foo' } });

  // Submit the form
  const submitBtn = within(leftMenuComponent).getByRole('img', {
    name: 'search',
  });
  fireEvent.submit(submitBtn);

  // Wait for components to rerender
  await waitFor(() => getByTestId('search'));

  // Check tag renders
  const tag = await waitFor(() => getByTestId('foo'));
  expect(tag).toBeTruthy();

  // Click on the ClearAllTag
  const clearAllTag = await waitFor(() => getByText('Clear All'));
  expect(clearAllTag).toBeTruthy();
  fireEvent.click(clearAllTag);

  // Change value for free-text input and submit again
  fireEvent.change(freeTextInput, { target: { value: 'baz' } });
  fireEvent.submit(submitBtn);

  // Wait for components to rerender
  await waitFor(() => getByTestId('search'));

  // Check baz tag exists
  const bazTag = await waitFor(() => getByTestId('baz'));
  expect(bazTag).toBeTruthy();

  // Close the baz tag
  fireEvent.click(within(bazTag).getByRole('img', { name: 'close' }));

  // Wait for components to rerender
  await waitFor(() => getByTestId('search'));
});

it('handles applying general facets', async () => {
  const { getByTestId, getByText } = customRender(
    <App searchQuery={activeSearch} />
  );

  // Check applicable components render
  const facetsComponent = await waitFor(() => getByTestId('facets'));
  expect(facetsComponent).toBeTruthy();

  // Wait for project form to render
  const projectForm = await waitFor(() => getByTestId('project-form'));
  expect(projectForm).toBeTruthy();

  // Check project select form exists and mouseDown to expand list of options to expand options
  const projectFormSelect = within(projectForm).getByRole('combobox');

  expect(projectFormSelect).toBeTruthy();
  fireEvent.mouseDown(projectFormSelect);

  // Select the second project option
  const projectOption = getByTestId('project_1');
  expect(projectOption).toBeTruthy();
  fireEvent.click(projectOption);

  // Submit the form
  const submitBtn = within(facetsComponent).getByRole('img', {
    name: 'select',
  });
  fireEvent.submit(submitBtn);

  // Wait for facets forms to rerender
  const facetsForm = await waitFor(() => getByTestId('facets-form'));
  expect(facetsForm).toBeTruthy();

  // Open additional properties collapse panel
  const additionalPropertiesPanel = within(facetsComponent).getByRole(
    'button',
    {
      name: 'right Additional Properties',
    }
  );
  fireEvent.click(additionalPropertiesPanel);

  // Change result type
  // Check facet select form exists and mouseDown to expand list of options
  const resultTypeSelect = getByTestId('result-type-form-select');
  expect(resultTypeSelect).toBeTruthy();
  fireEvent.mouseDown(resultTypeSelect.firstElementChild as HTMLInputElement);

  // Select the first facet option
  const resultTypeOption = await waitFor(() => getByText('Originals only'));
  expect(resultTypeOption).toBeTruthy();
  fireEvent.click(resultTypeOption);
  await waitFor(() => getByTestId('facets-form'));

  await waitFor(() => getByTestId('search'));
});

it('handles applying and removing project facets', async () => {
  const { getByTestId, getByText } = customRender(
    <App searchQuery={activeSearch} />
  );

  // Check applicable components render
  const facetsComponent = await waitFor(() => getByTestId('facets'));
  expect(facetsComponent).toBeTruthy();

  // Wait for project form to render
  const projectForm = await waitFor(() => getByTestId('project-form'));
  expect(projectForm).toBeTruthy();

  // Check project select form exists and mouseDown to expand list of options to
  // expand options
  const projectFormSelect = within(projectForm).getByRole('combobox');

  expect(projectFormSelect).toBeTruthy();
  fireEvent.mouseDown(projectFormSelect);

  // Select the second project option
  const projectOption = getByTestId('project_1');
  expect(projectOption).toBeTruthy();
  fireEvent.click(projectOption);

  // Submit the form
  const submitBtn = within(facetsComponent).getByRole('img', {
    name: 'select',
  });
  fireEvent.submit(submitBtn);

  // Wait for project form to render
  const facetsForm = await waitFor(() => getByTestId('facets-form'));
  expect(facetsForm).toBeTruthy();

  // Open top collapse panel
  const group1Panel = within(facetsComponent).getByRole('button', {
    name: 'right Group1',
  });
  fireEvent.click(group1Panel);

  // Open Collapse Panel in Collapse component for the data_node form to render
  const collapse = getByText('Data Node');
  fireEvent.click(collapse);

  // Check facet select form exists and mouseDown to expand list of options
  const facetFormSelect = getByTestId('data_node-form-select');
  expect(facetFormSelect).toBeTruthy();
  fireEvent.mouseDown(facetFormSelect.firstElementChild as HTMLInputElement);

  // Select the first facet option
  const facetOption = await waitFor(() =>
    getByTestId('data_node_aims3.llnl.gov')
  );
  expect(facetOption).toBeTruthy();
  fireEvent.click(facetOption);

  // Apply facets
  fireEvent.keyDown(facetFormSelect, {
    key: 'Escape',
    code: 'Escape',
    keyCode: '27',
    charCode: '27',
  });

  // Wait for components to rerender
  await waitFor(() => getByTestId('search'));

  // Check facet option applied
  const tag = await waitFor(() => getByTestId('aims3.llnl.gov'));
  expect(tag).toBeTruthy();

  // Check facets select form rerenders and mouseDown to expand list of options
  const facetFormSelectRerender = getByTestId('data_node-form-select');
  expect(facetFormSelectRerender).toBeTruthy();
  fireEvent.mouseDown(
    facetFormSelectRerender.firstElementChild as HTMLInputElement
  );

  // Check option is selected and remove it
  const facetOptionRerender = await waitFor(() =>
    within(facetFormSelectRerender).getByRole('img', {
      name: 'close',
      hidden: true,
    })
  );
  expect(facetOptionRerender).toBeTruthy();
  fireEvent.click(facetOptionRerender);

  // Remove facets
  fireEvent.keyDown(facetFormSelectRerender, {
    key: 'Escape',
    code: 'Escape',
    keyCode: '27',
    charCode: '27',
  });

  // Wait for component to rerender
  await waitFor(() => getByTestId('search'));
});

it('handles project changes and clearing filters when the active project !== selected project', async () => {
  const { getByTestId } = customRender(<App searchQuery={activeSearch} />);

  // Check applicable components render
  const facetsComponent = await waitFor(() => getByTestId('facets'));
  expect(facetsComponent).toBeTruthy();

  // Wait for project form to render
  const projectForm = await waitFor(() => getByTestId('project-form'));
  expect(projectForm).toBeTruthy();

  // Check project select form exists and mouseDown to expand list of options
  const projectFormSelect = within(projectForm).getByRole('combobox');

  expect(projectFormSelect).toBeTruthy();
  fireEvent.mouseDown(projectFormSelect);

  // Select the second project option
  const projectOption = await waitFor(() => getByTestId('project_1'));
  expect(projectOption).toBeInTheDocument();
  fireEvent.click(projectOption);

  // Check facets component re-renders
  const facetsComponent2 = await waitFor(() => getByTestId('facets'));
  expect(facetsComponent).toBeTruthy();

  // Submit the form
  const submitBtn = within(facetsComponent2).getByRole('img', {
    name: 'select',
  });

  fireEvent.submit(submitBtn);

  // Wait for components to rerender
  await waitFor(() => getByTestId('facets'));

  // Check project select form exists again and mouseDown to expand list of options
  const projectFormSelect2 = within(projectForm).getByRole('combobox');

  fireEvent.mouseDown(projectFormSelect2);

  // Select the first project option
  const firstOption = await waitFor(() => getByTestId('project_0'));
  expect(firstOption).toBeInTheDocument();
  fireEvent.click(firstOption);

  // Submit the form
  fireEvent.submit(submitBtn);

  // Wait for components to rerender
  await waitFor(() => getByTestId('facets'));
});

it('fetches the data node status every defined interval', () => {
  jest.useFakeTimers();

  customRender(<App searchQuery={activeSearch} />);

  act(() => {
    jest.advanceTimersByTime(295000);
  });
  jest.useRealTimers();
});
describe('User cart', () => {
  it('handles authenticated user adding and removing items from cart', async () => {
    const {
      getByRole,
      getByTestId,
      getByText,
      getByPlaceholderText,
    } = customRender(<App searchQuery={activeSearch} />, {
      token: 'token',
    });

    // Check applicable components render
    const leftMenuComponent = await waitFor(() => getByTestId('left-menu'));
    expect(leftMenuComponent).toBeTruthy();

    // Change value for free-text input
    const input = 'foo';
    const freeTextInput = await waitFor(() =>
      getByPlaceholderText('Search for a keyword')
    );
    expect(freeTextInput).toBeTruthy();
    fireEvent.change(freeTextInput, { target: { value: input } });

    // Submit the form
    const submitBtn = within(leftMenuComponent).getByRole('img', {
      name: 'search',
    });
    fireEvent.submit(submitBtn);

    // Wait for components to rerender
    await waitFor(() => getByTestId('search'));

    // Check first row exists
    const firstRow = await waitFor(() =>
      getByRole('row', {
        name: getRowName('plus', 'close', 'bar', '2', '1', '1'),
      })
    );
    expect(firstRow).toBeTruthy();

    // Check first row has add button and click it
    const addBtn = within(firstRow).getByRole('img', { name: 'plus' });
    expect(addBtn).toBeTruthy();
    fireEvent.click(addBtn);

    // Check 'Added items(s) to the cart' message appears
    const addText = await waitFor(() =>
      getByText('Added item(s) to your cart')
    );
    expect(addText).toBeTruthy();

    // Check first row has remove button and click it
    const removeBtn = within(firstRow).getByRole('img', { name: 'minus' });
    expect(removeBtn).toBeTruthy();
    fireEvent.click(removeBtn);

    // Check 'Removed items(s) from the cart' message appears
    const removeText = await waitFor(() =>
      getByText('Removed item(s) from your cart')
    );
    expect(removeText).toBeTruthy();
  });

  it("displays authenticated user's number of files in the cart summary and handles clearing the cart", async () => {
    const { getByRole, getByTestId, getByText } = customRender(
      <App searchQuery={activeSearch} />,
      {
        token: 'token',
      }
    );

    // Check applicable components render
    const rightMenuComponent = await waitFor(() => getByTestId('right-menu'));
    expect(rightMenuComponent).toBeTruthy();

    // Click on the cart link
    const cartLink = within(rightMenuComponent).getByRole('img', {
      name: 'shopping-cart',
    });
    expect(cartLink).toBeTruthy();
    fireEvent.click(cartLink);

    // Check number of files and datasets are correctly displayed
    const cart = await waitFor(() => getByTestId('cart'));
    expect(cart).toBeTruthy();
    const cartSummary = await waitFor(() => getByTestId('summary'));
    expect(cartSummary).toBeTruthy();

    const numDatasetsField = await waitFor(() =>
      within(cartSummary).getByText('Number of Datasets:')
    );
    const numFilesText = await waitFor(() =>
      within(cartSummary).getByText('Number of Files:')
    );

    expect(numDatasetsField.textContent).toEqual('Number of Datasets: 1');
    expect(numFilesText.textContent).toEqual('Number of Files: 3');

    // Check "Remove All Items" button renders with cart > 0 items and click it
    const clearCartBtn = within(cart).getByRole('button', {
      name: 'Remove All Items',
    });
    expect(clearCartBtn).toBeTruthy();
    fireEvent.click(clearCartBtn);

    await waitFor(() => getByTestId('cart'));

    // Check confirmBtn exists in popover and click it
    const confirmBtn = await waitFor(() =>
      getByRole('button', {
        name: 'OK',
      })
    );
    expect(confirmBtn).toBeTruthy();
    fireEvent.click(confirmBtn);

    // Check number of datasets and files are now 0
    expect(numDatasetsField.textContent).toEqual('Number of Datasets: 0');
    expect(numFilesText.textContent).toEqual('Number of Files: 0');

    // Check empty alert renders
    const emptyAlert = getByText('Your cart is empty');
    expect(emptyAlert).toBeTruthy();
  });

  it('handles anonymous user adding and removing items from cart', async () => {
    const { getByRole, getByTestId, getByPlaceholderText } = customRender(
      <App searchQuery={activeSearch} />
    );

    // Check applicable components render
    const leftMenuComponent = await waitFor(() => getByTestId('left-menu'));
    expect(leftMenuComponent).toBeTruthy();

    // Change value for free-text input
    const input = 'foo';
    const freeTextInput = await waitFor(() =>
      getByPlaceholderText('Search for a keyword')
    );
    expect(freeTextInput).toBeTruthy();
    fireEvent.change(freeTextInput, { target: { value: input } });

    // Submit the form
    const submitBtn = within(leftMenuComponent).getByRole('img', {
      name: 'search',
    });
    fireEvent.submit(submitBtn);

    // Wait for components to rerender
    await waitFor(() => getByTestId('search'));

    // Check first row exists
    const firstRow = await waitFor(() =>
      getByRole('row', {
        name: getRowName('plus', 'check', 'foo', '3', '1', '1'),
      })
    );
    expect(firstRow).toBeTruthy();

    // Check first row has add button and click it
    const addBtn = within(firstRow).getByRole('img', { name: 'plus' });
    expect(addBtn).toBeTruthy();
    fireEvent.click(addBtn);

    // Check first row has remove button and click it
    const removeBtn = within(firstRow).getByRole('img', { name: 'minus' });
    expect(removeBtn).toBeTruthy();
    fireEvent.click(removeBtn);
  });

  it('displays anonymous user"s number of files in the cart summary and handles clearing the cart', async () => {
    const {
      getByRole,
      getByTestId,
      getByText,
      getByPlaceholderText,
    } = customRender(<App searchQuery={activeSearch} />);

    // Check applicable components render
    const leftMenuComponent = await waitFor(() => getByTestId('left-menu'));
    expect(leftMenuComponent).toBeTruthy();
    const rightMenuComponent = await waitFor(() => getByTestId('right-menu'));
    expect(leftMenuComponent).toBeTruthy();

    // Change value for free-text input
    const input = 'foo';
    const freeTextInput = await waitFor(() =>
      getByPlaceholderText('Search for a keyword')
    );
    expect(freeTextInput).toBeTruthy();
    fireEvent.change(freeTextInput, { target: { value: input } });

    // Submit the form
    const submitBtn = within(leftMenuComponent).getByRole('img', {
      name: 'search',
    });
    fireEvent.submit(submitBtn);

    // Wait for components to rerender
    await waitFor(() => getByTestId('search'));

    // Check first row exists
    const firstRow = await waitFor(() =>
      getByRole('row', {
        name: getRowName('plus', 'check', 'foo', '3', '1', '1'),
      })
    );
    expect(firstRow).toBeTruthy();

    // Check first row has add button and click it
    const addBtn = within(firstRow).getByRole('img', { name: 'plus' });
    expect(addBtn).toBeTruthy();
    fireEvent.click(addBtn);

    // Click on the cart link
    const cartLink = within(rightMenuComponent).getByRole('img', {
      name: 'shopping-cart',
    });
    expect(cartLink).toBeTruthy();
    fireEvent.click(cartLink);

    // Check number of files and datasets are correctly displayed
    const cart = await waitFor(() => getByTestId('cart'));
    expect(cart).toBeTruthy();
    const cartSummary = await waitFor(() => getByTestId('summary'));
    expect(cartSummary).toBeTruthy();

    const numDatasetsField = await waitFor(() =>
      within(cartSummary).getByText('Number of Datasets:')
    );
    const numFilesText = await waitFor(() =>
      within(cartSummary).getByText('Number of Files:')
    );

    expect(numDatasetsField.textContent).toEqual('Number of Datasets: 1');
    expect(numFilesText.textContent).toEqual('Number of Files: 3');

    // Check "Remove All Items" button renders with cart > 0 items and click it
    const clearCartBtn = within(cart).getByRole('button', {
      name: 'Remove All Items',
    });
    expect(clearCartBtn).toBeTruthy();
    fireEvent.click(clearCartBtn);

    await waitFor(() => getByTestId('cart'));

    // Check confirmBtn exists in popover and click it
    const confirmBtn = await waitFor(() =>
      getByRole('button', {
        name: 'OK',
      })
    );
    expect(confirmBtn).toBeTruthy();
    fireEvent.click(confirmBtn);

    // Check number of datasets and files are now 0
    expect(numDatasetsField.textContent).toEqual('Number of Datasets: 0');
    expect(numFilesText.textContent).toEqual('Number of Files: 0');

    // Check empty alert renders
    const emptyAlert = getByText('Your cart is empty');
    expect(emptyAlert).toBeTruthy();
  });

  describe('Error handling', () => {
    it('displays error message after failing to fetch authenticated user"s cart', async () => {
      server.use(
        rest.get(apiRoutes.userCart.path, (_req, res, ctx) =>
          res(ctx.status(404))
        )
      );

      const { getByText, getByTestId } = customRender(
        <App searchQuery={activeSearch} />,
        {
          token: 'token',
        }
      );

      // Check applicable components render
      const navComponent = await waitFor(() => getByTestId('nav-bar'));
      expect(navComponent).toBeTruthy();

      // Check error message renders after failing to fetch cart from API
      const errorMsg = await waitFor(() =>
        getByText(apiRoutes.userCart.handleErrorMsg(404))
      );
      expect(errorMsg).toBeTruthy();
    });
  });
});

describe('User search library', () => {
  it('handles authenticated user saving and applying searches', async () => {
    const { getByTestId, getByPlaceholderText, getByRole } = customRender(
      <App searchQuery={activeSearch} />,
      { token: 'token' }
    );

    // Check applicable components render
    const leftMenuComponent = await waitFor(() => getByTestId('left-menu'));
    expect(leftMenuComponent).toBeTruthy();
    const rightMenuComponent = await waitFor(() => getByTestId('right-menu'));
    expect(rightMenuComponent).toBeTruthy();

    // Change value for free-text input
    const input = 'foo';
    const freeTextInput = await waitFor(() =>
      getByPlaceholderText('Search for a keyword')
    );
    expect(freeTextInput).toBeTruthy();
    fireEvent.change(freeTextInput, { target: { value: input } });

    // Submit the form
    const submitBtn = within(leftMenuComponent).getByRole('img', {
      name: 'search',
    });
    fireEvent.submit(submitBtn);

    // Wait for components to rerender
    await waitFor(() => getByTestId('search'));

    // Check Save Search button exists and click it
    const saveSearch = await waitFor(() =>
      getByRole('button', { name: 'book Save Search' })
    );
    expect(saveSearch).toBeTruthy();
    fireEvent.click(saveSearch);

    // Click Save Search button again to check if duplicates are saved
    await delay(500);
    fireEvent.click(saveSearch);

    // Click on the search library link
    const searchLibraryLink = within(rightMenuComponent).getByRole('img', {
      name: 'file-search',
    });
    expect(searchLibraryLink).toBeTruthy();
    fireEvent.click(searchLibraryLink);

    // Check cart renders
    const cart = await waitFor(() => getByTestId('cart'));
    expect(cart).toBeTruthy();

    // Check apply search button renders and click it
    const applySearchBtn = await waitFor(() => getByTestId('apply-1'));
    expect(applySearchBtn).toBeTruthy();
    fireEvent.click(applySearchBtn);

    // Wait for components to rerender
    await waitFor(() => getByTestId('search'));
  });

  it('handles authenticated user removing searches from the search library', async () => {
    const { getByRole, getByTestId, getByText } = customRender(
      <App searchQuery={activeSearch} />,
      {
        token: 'token',
      }
    );

    // Check applicable components render
    const navComponent = await waitFor(() => getByTestId('nav-bar'));
    expect(navComponent).toBeTruthy();
    const leftMenuComponent = await waitFor(() => getByTestId('left-menu'));
    expect(leftMenuComponent).toBeTruthy();
    const rightMenuComponent = await waitFor(() => getByTestId('right-menu'));
    expect(rightMenuComponent).toBeTruthy();

    // Go directly to the search library since user already has items in their cart
    const searchLibraryLink = await waitFor(() =>
      within(rightMenuComponent).getByRole('img', { name: 'file-search' })
    );
    expect(searchLibraryLink).toBeTruthy();
    fireEvent.click(searchLibraryLink);

    // Check number of files and datasets are correctly displayed
    const cart = await waitFor(() => getByTestId('cart'));
    expect(cart).toBeTruthy();

    // Check delete button renders for the saved search and click it
    const deleteBtn = await waitFor(() =>
      getByRole('img', { name: 'delete', hidden: true })
    );
    expect(deleteBtn).toBeTruthy();
    fireEvent.click(deleteBtn);

    await waitFor(() => getByTestId('cart'));

    // Check removed message appears
    const removeText = await waitFor(() =>
      getByText('Removed search query from your library')
    );
    expect(removeText).toBeTruthy();
  });

  it('handles anonymous user saving and applying searches', async () => {
    const { getByTestId, getByPlaceholderText, getByRole } = customRender(
      <App searchQuery={activeSearch} />
    );

    // Check applicable components render
    const leftMenuComponent = await waitFor(() => getByTestId('left-menu'));
    expect(leftMenuComponent).toBeTruthy();
    const rightMenuComponent = await waitFor(() => getByTestId('right-menu'));
    expect(rightMenuComponent).toBeTruthy();

    // Change value for free-text input
    const input = 'foo';
    const freeTextInput = await waitFor(() =>
      getByPlaceholderText('Search for a keyword')
    );
    expect(freeTextInput).toBeTruthy();
    fireEvent.change(freeTextInput, { target: { value: input } });

    // Submit the form
    const submitBtn = within(leftMenuComponent).getByRole('img', {
      name: 'search',
    });
    fireEvent.submit(submitBtn);

    // Wait for components to rerender
    await waitFor(() => getByTestId('search'));

    // Check Save Search button exists and click it
    const saveSearch = await waitFor(() =>
      getByRole('button', { name: 'book Save Search' })
    );
    expect(saveSearch).toBeTruthy();
    fireEvent.click(saveSearch);

    // Click on the search library link
    const searchLibraryLink = within(rightMenuComponent).getByRole('img', {
      name: 'file-search',
    });
    expect(searchLibraryLink).toBeTruthy();
    fireEvent.click(searchLibraryLink);

    // Check cart renders
    const cart = await waitFor(() => getByTestId('cart'));
    expect(cart).toBeTruthy();

    // Check apply search button renders and click it
    const applySearchBtn = await waitFor(() =>
      within(cart).getByRole('img', { name: 'search', hidden: true })
    );
    expect(applySearchBtn).toBeTruthy();
    fireEvent.click(applySearchBtn);

    // Wait for components to rerender
    await waitFor(() => getByTestId('facets'));
  });
  it('handles anonymous user removing searches from the search library', async () => {
    const { getByPlaceholderText, getByRole, getByTestId } = customRender(
      <App searchQuery={activeSearch} />
    );

    // Check applicable components render
    const leftMenuComponent = await waitFor(() => getByTestId('left-menu'));
    expect(leftMenuComponent).toBeTruthy();
    const rightMenuComponent = await waitFor(() => getByTestId('right-menu'));
    expect(rightMenuComponent).toBeTruthy();

    // Change value for free-text input
    const input = 'foo';
    const freeTextInput = await waitFor(() =>
      getByPlaceholderText('Search for a keyword')
    );
    expect(freeTextInput).toBeTruthy();
    fireEvent.change(freeTextInput, { target: { value: input } });

    // Submit the form
    const submitBtn = within(leftMenuComponent).getByRole('img', {
      name: 'search',
    });
    fireEvent.submit(submitBtn);

    // Wait for components to rerender
    await waitFor(() => getByTestId('search'));

    // Check Save Search button exists and click it
    const saveSearch = await waitFor(() =>
      getByRole('button', { name: 'book Save Search' })
    );
    expect(saveSearch).toBeTruthy();
    fireEvent.click(saveSearch);

    const searchLibraryLink = await waitFor(() =>
      within(rightMenuComponent).getByRole('img', {
        name: 'file-search',
        hidden: true,
      })
    );
    expect(searchLibraryLink).toBeTruthy();
    fireEvent.click(searchLibraryLink);

    const cart = await waitFor(() => getByTestId('cart'));
    expect(cart).toBeTruthy();

    // Check delete button renders for the saved search and click it
    const deleteBtn = getByTestId('remove-1');

    expect(deleteBtn).toBeTruthy();
    fireEvent.click(deleteBtn);

    await waitFor(() => getByTestId('cart'));
  });

  it('handles anonymous user copying search to clipboard', async () => {
    const { getByTestId, getByPlaceholderText, getByRole } = customRender(
      <App searchQuery={activeSearch} />
    );

    // Check applicable components render
    const leftMenuComponent = await waitFor(() => getByTestId('left-menu'));
    expect(leftMenuComponent).toBeTruthy();
    const rightMenuComponent = await waitFor(() => getByTestId('right-menu'));
    expect(rightMenuComponent).toBeTruthy();

    // Change value for free-text input
    const input = 'foo';
    const freeTextInput = await waitFor(() =>
      getByPlaceholderText('Search for a keyword')
    );
    expect(freeTextInput).toBeTruthy();
    fireEvent.change(freeTextInput, { target: { value: input } });

    // Submit the form
    const submitBtn = within(leftMenuComponent).getByRole('img', {
      name: 'search',
    });
    fireEvent.submit(submitBtn);

    // Wait for components to rerender
    await waitFor(() => getByTestId('search'));

    // Check Save Search button exists and click it
    const copySearch = await waitFor(() =>
      getByRole('button', { name: 'share-alt Copy Search' })
    );

    expect(copySearch).toBeTruthy();
    fireEvent.click(copySearch);
  });

  describe('Error handling', () => {
    it('displays error message after failing to fetch authenticated user"s saved search queries', async () => {
      server.use(
        rest.get(apiRoutes.userSearches.path, (_req, res, ctx) =>
          res(ctx.status(404))
        )
      );

      const { getByText, getByTestId } = customRender(
        <App searchQuery={activeSearch} />,
        {
          token: 'token',
        }
      );

      // Check applicable components render
      const navComponent = await waitFor(() => getByTestId('nav-bar'));
      expect(navComponent).toBeTruthy();

      // Check error message renders after failing to fetch cart from API
      const errorMsg = await waitFor(() =>
        getByText(apiRoutes.userSearches.handleErrorMsg(404))
      );
      expect(errorMsg).toBeTruthy();
    });

    it('displays error message after failing to add authenticated user"s saved search query', async () => {
      server.use(
        rest.post(apiRoutes.userSearches.path, (_req, res, ctx) =>
          res(ctx.status(404))
        )
      );

      const {
        getByTestId,
        getByPlaceholderText,
        getByRole,
        getByText,
      } = customRender(<App searchQuery={activeSearch} />, {
        token: 'token',
      });

      // Check applicable components render
      const leftMenuComponent = await waitFor(() => getByTestId('left-menu'));
      expect(leftMenuComponent).toBeTruthy();

      // Change value for free-text input
      const input = 'foo';
      const freeTextInput = await waitFor(() =>
        getByPlaceholderText('Search for a keyword')
      );
      expect(freeTextInput).toBeTruthy();
      fireEvent.change(freeTextInput, { target: { value: input } });

      // Submit the form
      const submitBtn = within(leftMenuComponent).getByRole('img', {
        name: 'search',
      });
      fireEvent.submit(submitBtn);

      // Wait for components to rerender
      await waitFor(() => getByTestId('search'));

      // Check Save Search button exists and click it
      const saveSearch = await waitFor(() =>
        getByRole('button', { name: 'book Save Search' })
      );
      expect(saveSearch).toBeTruthy();
      fireEvent.click(saveSearch);

      const errorMsg = await waitFor(() =>
        getByText(apiRoutes.userSearches.handleErrorMsg(404))
      );
      expect(errorMsg).toBeTruthy();
    });

    it('displays error message after failing to remove authenticated user"s saved search', async () => {
      // Override API response with 404
      server.use(
        rest.delete(apiRoutes.userSearch.path, (_req, res, ctx) =>
          res(ctx.status(404))
        )
      );

      const { getByTestId, getAllByText } = customRender(
        <App searchQuery={activeSearch} />,
        {
          token: 'token',
        }
      );

      // Check applicable components render
      const rightMenuComponent = await waitFor(() => getByTestId('right-menu'));
      expect(rightMenuComponent).toBeTruthy();

      // Go directly to the search library since user already has items in their cart
      const searchLibraryLink = await waitFor(() =>
        within(rightMenuComponent).getByRole('img', {
          name: 'file-search',
          hidden: true,
        })
      );
      expect(searchLibraryLink).toBeTruthy();
      fireEvent.click(searchLibraryLink);

      // Check cart component renders
      const cartComponent = await waitFor(() => getByTestId('cart'));
      expect(cartComponent).toBeTruthy();

      // Check delete button renders for the saved search and click it
      const deleteBtn = await waitFor(() =>
        within(cartComponent).getByRole('img', { name: 'delete', hidden: true })
      );
      expect(deleteBtn).toBeTruthy();
      fireEvent.click(deleteBtn);

      // FIXME: There should only be 1 error message rendering, but for some reason 3 render.
      // This might be because other tests leak in the describe block.
      // Using getAllByText instead of getByText for now to pass test.
      const errorMsg = await waitFor(() =>
        getAllByText(apiRoutes.userSearch.handleErrorMsg(404))
      );
      expect(errorMsg).toBeTruthy();
    });
  });
});

describe('User support', () => {
  it('renders user support modal when clicking help button and is closeable', () => {
    const { getByRole, getByText, findByText } = customRender(
      <App searchQuery={activeSearch} />
    );

    // support button renders
    const supportBtn = getByRole('img', { name: 'question' });
    expect(supportBtn).toBeTruthy();

    // click support button
    fireEvent.click(supportBtn);

    // GitHub icon renders
    const metagridSupportHeader = findByText(' MetaGrid Support');
    expect(metagridSupportHeader).toBeTruthy();

    // click close button
    // const closeBtn = getAllByRole('img', { name: 'close' })[1];
    // fireEvent.click(closeBtn);

    // click close button
    const closeBtn = getByText('Close Support');
    fireEvent.click(closeBtn);
  });
});

describe('Data node status page', () => {
  it('renders the node status page after clicking the link', async () => {
    const { getByTestId } = customRender(<App searchQuery={activeSearch} />);
    const rightMenuComponent = await waitFor(() => getByTestId('right-menu'));
    expect(rightMenuComponent).toBeTruthy();

    const nodeLink = within(rightMenuComponent).getByRole('link', {
      name: 'node-index Node Status',
    });
    expect(nodeLink).toBeTruthy();
    fireEvent.click(nodeLink);

    const nodeStatusPage = await waitFor(() => getByTestId('node-status'));
    expect(nodeStatusPage).toBeTruthy();
  });
});
