/**
 * This file contains tests for the App component.
 *
 * The App component uses React Router and React Context, so it must be wrapped
 * in order to mock their behaviors.
 *
 */
import { fireEvent, waitFor, within } from '@testing-library/react';
import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { rest, server } from '../../api/mock/setup-env';
import apiRoutes from '../../api/routes';
import { customRender } from '../../test/custom-render';
import App from './App';

// Used to restore window.location after each test
const location = JSON.stringify(window.location);

afterEach(() => {
  // Routes are already declared in the App component using BrowserRouter, so MemoryRouter does
  // not work to isolate routes in memory between tests. The only workaround is to delete window.location and restore it after each test in order to reset the URL location.
  // https://stackoverflow.com/a/54222110
  // https://stackoverflow.com/questions/59892304/cant-get-memoryrouter-to-work-with-testing-library-react

  delete window.location;
  window.location = (JSON.parse(location) as unknown) as Location;

  // Clear localStorage between tests
  localStorage.clear();

  // Reset all mocks after each test
  jest.clearAllMocks();
});

it('renders App component', async () => {
  const { getByTestId } = customRender(
    <Router>
      <App />
    </Router>
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
    <Router>
      <App />
    </Router>
  );

  // Check applicable components render
  const navComponent = await waitFor(() => getByTestId('nav-bar'));
  expect(navComponent).toBeTruthy();
  const leftMenuComponent = await waitFor(() => getByTestId('left-menu'));
  expect(leftMenuComponent).toBeTruthy();
  const facetsComponent = await waitFor(() => getByTestId('facets'));
  expect(facetsComponent).toBeTruthy();

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

  // Wait for components to re-render
  await waitFor(() => getByTestId('search'));
  await waitFor(() => getByTestId('search-table'));
  await waitFor(() => getByTestId('facets'));

  // Change the value for free-text input to 'foo' again and submit
  fireEvent.change(freeTextForm, { target: { value: input } });
  fireEvent.submit(submitBtn);

  // Check error message appears that input has already been applied
  const errorMsg = await waitFor(() =>
    getByText(`Input "${input}" has already been applied`)
  );
  expect(errorMsg).toBeTruthy();
});

it('handles removing search tags and clearing all search tags', async () => {
  const { getByPlaceholderText, getByTestId, getByText } = customRender(
    <Router>
      <App />
    </Router>
  );

  // Check applicable components render
  const navComponent = await waitFor(() => getByTestId('nav-bar'));
  expect(navComponent).toBeTruthy();
  const leftMenuComponent = await waitFor(() => getByTestId('left-menu'));
  expect(navComponent).toBeTruthy();
  const facetsComponent = await waitFor(() => getByTestId('facets'));
  expect(facetsComponent).toBeTruthy();

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

  // Wait for components to re-render
  await waitFor(() => getByTestId('search'));
  await waitFor(() => getByTestId('search-table'));
  await waitFor(() => getByTestId('facets'));

  // Check foo tag renders
  const fooTag = await waitFor(() => getByTestId('foo'));
  expect(fooTag).toBeTruthy();

  // Click on the ClearAllTag
  const clearAllTag = await waitFor(() => getByText('Clear All'));
  expect(clearAllTag).toBeTruthy();
  fireEvent.click(within(clearAllTag).getByRole('img', { name: 'close' }));

  // Change value for free-text input and submit again
  fireEvent.change(freeTextInput, { target: { value: 'baz' } });
  fireEvent.submit(submitBtn);

  // Wait for components to re-render
  await waitFor(() => getByTestId('search'));
  await waitFor(() => getByTestId('search-table'));
  await waitFor(() => getByTestId('facets'));

  // Check baz tag exists
  const bazTag = await waitFor(() => getByTestId('baz'));
  expect(bazTag).toBeTruthy();

  // Close the baz tag
  fireEvent.click(within(bazTag).getByRole('img', { name: 'close' }));

  // Wait for components to re-render
  await waitFor(() => getByTestId('search'));
  await waitFor(() => getByTestId('search-table'));
  await waitFor(() => getByTestId('facets'));
});

it('handles removing facet tags', async () => {
  const { getByTestId, getByText } = customRender(
    <Router>
      <App />
    </Router>
  );

  // Check applicable components render
  const navComponent = await waitFor(() => getByTestId('nav-bar'));
  expect(navComponent).toBeTruthy();
  const facetsComponent = await waitFor(() => getByTestId('facets'));
  expect(facetsComponent).toBeTruthy();

  // Wait for project form to render
  const projectForm = await waitFor(() => getByTestId('project-form'));
  expect(projectForm).toBeTruthy();

  // Check project select form exists and mouseDown to expand list of options to expand options
  const projectFormSelect = document.querySelector(
    '[data-testid=project-form-select] > .ant-select-selector'
  ) as HTMLFormElement;
  expect(projectFormSelect).toBeTruthy();
  fireEvent.mouseDown(projectFormSelect);

  // Select the first project option
  const projectOption = getByTestId('project_0');
  expect(projectOption).toBeTruthy();
  fireEvent.click(projectOption);

  // Submit the form
  const submitBtn = within(facetsComponent).getByRole('img', {
    name: 'select',
  });
  fireEvent.submit(submitBtn);

  // Open Collapse Panel in Collapse component for the facet1 form to render
  const collapse = await waitFor(() => getByText('Facet1'));
  fireEvent.click(collapse);

  // Check facet select form exists and mouseDown to expand list of options
  const facetFormSelect = document.querySelector(
    '[data-testid=facet1-form-select] > .ant-select-selector'
  ) as HTMLFormElement;
  expect(facetFormSelect).toBeTruthy();
  fireEvent.mouseDown(facetFormSelect);

  // Select the first facet option
  const facetOption = await waitFor(() => getByTestId('facet1_foo'));
  expect(facetOption).toBeTruthy();
  fireEvent.click(facetOption);

  // Wait for components to re-render
  await waitFor(() => getByTestId('search'));
  await waitFor(() => getByTestId('search-table'));
  await waitFor(() => getByTestId('facets'));

  // Check foo tag exists
  const fooTag = await waitFor(() => getByTestId('foo'));
  expect(fooTag).toBeTruthy();

  // Close the baz tag
  fireEvent.click(within(fooTag).getByRole('img', { name: 'close' }));

  // Wait for components to re-render
  await waitFor(() => getByTestId('search'));
  await waitFor(() => getByTestId('search-table'));
  await waitFor(() => getByTestId('facets'));
});

it('handles project changes and clearing filters when the active project !== selected project', async () => {
  const { getByTestId } = customRender(
    <Router>
      <App />
    </Router>
  );

  // Check applicable components render
  const facetsComponent = await waitFor(() => getByTestId('facets'));
  expect(facetsComponent).toBeTruthy();
  const navComponent = await waitFor(() => getByTestId('nav-bar'));
  expect(navComponent).toBeTruthy();

  // Wait for project form to render
  const projectForm = await waitFor(() => getByTestId('project-form'));
  expect(projectForm).toBeTruthy();

  // Check project select form exists and mouseDown to expand list of options
  const projectFormSelect = document.querySelector(
    '[data-testid=project-form-select] > .ant-select-selector'
  ) as HTMLFormElement;
  expect(projectFormSelect).toBeTruthy();
  fireEvent.mouseDown(projectFormSelect);

  // Select the first project option
  const projectOption = await waitFor(() => getByTestId('project_0'));
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

  // Wait for components to re-render
  await waitFor(() => getByTestId('search'));
  await waitFor(() => getByTestId('search-table'));
  await waitFor(() => getByTestId('facets'));

  // Check project select form exists again and mouseDown to expand list of options
  const projectFormSelect2 = document.querySelector(
    '[data-testid=project-form-select] > .ant-select-selector'
  ) as HTMLFormElement;
  expect(projectFormSelect).toBeTruthy();
  fireEvent.mouseDown(projectFormSelect2);

  // Select the second project option
  const secondOption = await waitFor(() => getByTestId('project_1'));
  expect(secondOption).toBeInTheDocument();
  fireEvent.click(secondOption);

  // Submit the form
  fireEvent.submit(submitBtn);

  // Wait for components to re-render
  await waitFor(() => getByTestId('search'));
  await waitFor(() => getByTestId('search-table'));
  await waitFor(() => getByTestId('facets'));
});

describe('User cart', () => {
  it('handles authenticated user adding and removing items from cart', async () => {
    const {
      getByRole,
      getByTestId,
      getByText,
      getByPlaceholderText,
    } = customRender(
      <Router>
        <App />
      </Router>,
      { token: 'token' }
    );

    // Check applicable components render
    const navComponent = await waitFor(() => getByTestId('nav-bar'));
    expect(navComponent).toBeTruthy();
    const leftMenuComponent = await waitFor(() => getByTestId('left-menu'));
    expect(leftMenuComponent).toBeTruthy();
    const facetsComponent = await waitFor(() => getByTestId('facets'));
    expect(facetsComponent).toBeTruthy();

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

    // Wait for components to re-render
    await waitFor(() => getByTestId('search'));
    await waitFor(() => getByTestId('search-table'));
    await waitFor(() => getByTestId('facets'));

    // Check first row exists
    const firstRow = await waitFor(() =>
      getByRole('row', {
        name:
          'right-circle foo 3 1 Bytes node.gov 1 check-circle Globus Compatible wget download plus',
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
  it('displays authenticated user"s number of files in the cart summary and handles clearing the cart', async () => {
    const { getByRole, getByTestId, getByText } = customRender(
      <Router>
        <App />
      </Router>,
      { token: 'token' }
    );

    // Check applicable components render
    const navComponent = await waitFor(() => getByTestId('nav-bar'));
    expect(navComponent).toBeTruthy();
    const leftMenuComponent = await waitFor(() => getByTestId('left-menu'));
    expect(leftMenuComponent).toBeTruthy();
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

    expect(
      getByText((_, node) => node.textContent === 'Number of Datasets: 1')
    ).toBeTruthy();
    expect(
      getByText((_, node) => node.textContent === 'Number of Files: 3')
    ).toBeTruthy();

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
    expect(
      getByText((_, node) => node.textContent === 'Number of Datasets: 0')
    ).toBeTruthy();
    expect(
      getByText((_, node) => node.textContent === 'Number of Files: 0')
    ).toBeTruthy();

    // Check empty alert renders
    const emptyAlert = getByText('Your cart is empty');
    expect(emptyAlert).toBeTruthy();
  });

  it('handles anonymous user adding and removing items from cart', async () => {
    const {
      getByRole,
      getByTestId,
      getByText,
      getByPlaceholderText,
    } = customRender(
      <Router>
        <App />
      </Router>
    );

    // Check applicable components render
    const navComponent = await waitFor(() => getByTestId('nav-bar'));
    expect(navComponent).toBeTruthy();
    const leftMenuComponent = await waitFor(() => getByTestId('left-menu'));
    expect(leftMenuComponent).toBeTruthy();
    const facetsComponent = await waitFor(() => getByTestId('facets'));
    expect(facetsComponent).toBeTruthy();

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

    // Wait for components to re-render
    await waitFor(() => getByTestId('search'));
    await waitFor(() => getByTestId('search-table'));
    await waitFor(() => getByTestId('facets'));

    // Check first row exists
    const firstRow = await waitFor(() =>
      getByRole('row', {
        name:
          'right-circle foo 3 1 Bytes node.gov 1 check-circle Globus Compatible wget download plus',
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

  it('displays anonymous user"s number of files in the cart summary and handles clearing the cart', async () => {
    const {
      getByRole,
      getByTestId,
      getByText,
      getByPlaceholderText,
    } = customRender(
      <Router>
        <App />
      </Router>
    );

    // Check applicable components render
    const navComponent = await waitFor(() => getByTestId('nav-bar'));
    expect(navComponent).toBeTruthy();
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

    // Wait for components to re-render
    await waitFor(() => getByTestId('search'));
    await waitFor(() => getByTestId('search-table'));
    await waitFor(() => getByTestId('facets'));

    // Check first row exists
    const firstRow = await waitFor(() =>
      getByRole('row', {
        name:
          'right-circle foo 3 1 Bytes node.gov 1 check-circle Globus Compatible wget download plus',
      })
    );
    expect(firstRow).toBeTruthy();

    // Check first row has add button and click it
    const addBtn = within(firstRow).getByRole('img', { name: 'plus' });
    expect(addBtn).toBeTruthy();
    fireEvent.click(addBtn);

    // Click on the cart link
    const cartLink = getByRole('link', { name: 'shopping-cart' });
    expect(cartLink).toBeTruthy();
    fireEvent.click(cartLink);

    // Check number of files and datasets are correctly displayed
    const cart = await waitFor(() => getByTestId('cart'));
    expect(cart).toBeTruthy();
    const cartSummary = await waitFor(() => getByTestId('summary'));
    expect(cartSummary).toBeTruthy();

    expect(
      getByText((_, node) => node.textContent === 'Number of Datasets: 1')
    ).toBeTruthy();
    expect(
      getByText((_, node) => node.textContent === 'Number of Files: 3')
    ).toBeTruthy();

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
    expect(
      getByText((_, node) => node.textContent === 'Number of Datasets: 0')
    ).toBeTruthy();
    expect(
      getByText((_, node) => node.textContent === 'Number of Files: 0')
    ).toBeTruthy();

    // Check empty alert renders
    const emptyAlert = getByText('Your cart is empty');
    expect(emptyAlert).toBeTruthy();
  });

  describe('Error handling', () => {
    it('displays error message after failing to fetch authenticated user"s cart', async () => {
      server.use(
        rest.get(apiRoutes.userCart, (_req, res, ctx) => {
          return res(ctx.status(404));
        })
      );

      const { getByText, getByTestId } = customRender(
        <Router>
          <App />
        </Router>,
        { token: 'token' }
      );

      // Check applicable components render
      const navComponent = await waitFor(() => getByTestId('nav-bar'));
      expect(navComponent).toBeTruthy();

      // Check error message renders after failing to fetch cart from API
      const errorMsg = await waitFor(() =>
        getByText(
          'There was an issue fetching your cart. Please contact support or try again later.'
        )
      );
      expect(errorMsg).toBeTruthy();
    });
  });
});

describe('User search library', () => {
  it('handles authenticated user saving and applying searches', async () => {
    const { getByTestId, getByPlaceholderText, getByRole } = customRender(
      <Router>
        <App />
      </Router>,
      { token: 'token' }
    );

    // Check applicable components render
    const navComponent = await waitFor(() => getByTestId('nav-bar'));
    expect(navComponent).toBeTruthy();
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

    // Wait for components to re-render
    await waitFor(() => getByTestId('search'));
    await waitFor(() => getByTestId('search-table'));
    await waitFor(() => getByTestId('facets'));

    // Check Save Search button exists and click it
    const saveSearch = await waitFor(() =>
      getByRole('button', { name: 'book Save Search' })
    );
    expect(saveSearch).toBeTruthy();
    fireEvent.click(saveSearch);

    // Click on the search library link
    const searchLibraryLink = within(rightMenuComponent).getByRole('img', {
      name: 'search',
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

    // Wait for components to re-render
    await waitFor(() => getByTestId('facets'));
    await waitFor(() => getByTestId('search'));
    await waitFor(() => getByTestId('search-table'));

    // Wait for facets component to render again based on the results
    await waitFor(() => getByTestId('facets'));
  });
  it('handles authenticated user removing searches from the search library', async () => {
    const { getByRole, getByTestId, getByText } = customRender(
      <Router>
        <App />
      </Router>,
      { token: 'token' }
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
      within(rightMenuComponent).getByRole('img', { name: 'search' })
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
      getByText('Removed search criteria from your library')
    );
    expect(removeText).toBeTruthy();
  });

  it('handles anonymous user saving and applying searches', async () => {
    const { getByTestId, getByPlaceholderText, getByRole } = customRender(
      <Router>
        <App />
      </Router>
    );

    // Check applicable components render
    const navComponent = await waitFor(() => getByTestId('nav-bar'));
    expect(navComponent).toBeTruthy();
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

    // Wait for components to re-render
    await waitFor(() => getByTestId('search'));
    await waitFor(() => getByTestId('search-table'));
    await waitFor(() => getByTestId('facets'));

    // Check Save Search button exists and click it
    const saveSearch = await waitFor(() =>
      getByRole('button', { name: 'book Save Search' })
    );
    expect(saveSearch).toBeTruthy();
    fireEvent.click(saveSearch);

    // Click on the search library link
    const searchLibraryLink = within(rightMenuComponent).getByRole('img', {
      name: 'search',
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

    // Wait for components to re-render
    await waitFor(() => getByTestId('facets'));
    await waitFor(() => getByTestId('search'));
    await waitFor(() => getByTestId('search-table'));

    // Wait for facets component to render again based on the results
    await waitFor(() => getByTestId('facets'));
  });
  it('handles anonymous user removing searches from the search library', async () => {
    const {
      getByPlaceholderText,
      getByRole,
      getByTestId,
      getByText,
    } = customRender(
      <Router>
        <App />
      </Router>
    );

    // Check applicable components render
    const navComponent = await waitFor(() => getByTestId('nav-bar'));
    expect(navComponent).toBeTruthy();
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

    // Wait for components to re-render
    await waitFor(() => getByTestId('search'));
    await waitFor(() => getByTestId('search-table'));
    await waitFor(() => getByTestId('facets'));

    // Check Save Search button exists and click it
    const saveSearch = await waitFor(() =>
      getByRole('button', { name: 'book Save Search' })
    );
    expect(saveSearch).toBeTruthy();
    fireEvent.click(saveSearch);

    const searchLibraryLink = await waitFor(() =>
      within(rightMenuComponent).getByRole('img', { name: 'search' })
    );
    expect(searchLibraryLink).toBeTruthy();
    fireEvent.click(searchLibraryLink);

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
    const removeText = getByText('Removed search criteria from your library');
    expect(removeText).toBeTruthy();
  });

  describe('Error handling', () => {
    it('displays error message after failing to fetch authenticated user"s saved searches', async () => {
      server.use(
        rest.get(apiRoutes.userSearches, (_req, res, ctx) => {
          return res(ctx.status(404));
        })
      );

      const { getByText, getByTestId } = customRender(
        <Router>
          <App />
        </Router>,
        { token: 'token' }
      );

      // Check applicable components render
      const navComponent = await waitFor(() => getByTestId('nav-bar'));
      expect(navComponent).toBeTruthy();

      // Check error message renders after failing to fetch cart from API
      const errorMsg = await waitFor(() =>
        getByText(
          'There was an issue fetching your saved searches. Please contact support or try again later.'
        )
      );
      expect(errorMsg).toBeTruthy();
    });

    it('displays error message after failing to add authenticated user"s saved search', async () => {
      // Override API response with 404
      server.use(
        rest.post(apiRoutes.userSearches, (_req, res, ctx) => {
          return res(ctx.status(404));
        })
      );

      const {
        getByTestId,
        getByPlaceholderText,
        getByRole,
        getByText,
      } = customRender(
        <Router>
          <App />
        </Router>,
        { token: 'token' }
      );

      // Check applicable components render
      const navComponent = await waitFor(() => getByTestId('nav-bar'));
      expect(navComponent).toBeTruthy();
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

      // Wait for components to re-render
      await waitFor(() => getByTestId('search'));
      await waitFor(() => getByTestId('search-table'));
      await waitFor(() => getByTestId('facets'));

      // Check Save Search button exists and click it
      const saveSearch = await waitFor(() =>
        getByRole('button', { name: 'book Save Search' })
      );
      expect(saveSearch).toBeTruthy();
      fireEvent.click(saveSearch);

      const errorMsg = await waitFor(() =>
        getByText(
          'There was an issue updating your cart. Please contact support or try again later.'
        )
      );
      expect(errorMsg).toBeTruthy();
    });
    it('displays error message after failing to remove authenticated user"s saved search', async () => {
      // Override API response with 404
      server.use(
        rest.delete(apiRoutes.userSearch, (_req, res, ctx) => {
          return res(ctx.status(404));
        })
      );

      const { getByTestId, getByText } = customRender(
        <Router>
          <App />
        </Router>,
        { token: 'token' }
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
        within(rightMenuComponent).getByRole('img', { name: 'search' })
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
      const errorMsg = await waitFor(() =>
        getByText(
          'There was an issue updating your cart. Please contact support or try again later.'
        )
      );
      expect(errorMsg).toBeTruthy();
    });
  });
});

describe('User support', () => {
  it('renders user support modal when clicking fixed button and is closeable', () => {
    const { getByRole } = customRender(
      <Router>
        <App />
      </Router>
    );

    // support button renders
    const supportBtn = getByRole('img', { name: 'question', hidden: true });
    expect(supportBtn).toBeTruthy();

    // click support button
    fireEvent.click(supportBtn);

    // GitHub icon renders
    const githubIcon = getByRole('img', { name: 'github', hidden: true });
    expect(githubIcon).toBeTruthy();

    // click close button
    const closeBtn = getByRole('button', { name: 'Close' });
    fireEvent.click(closeBtn);
  });
});
