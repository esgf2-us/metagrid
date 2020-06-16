import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { render, waitFor, fireEvent, within } from '@testing-library/react';

import App from './App';
import mockAxios from './__mocks__/axios';

let projectResults: Project[];
let searchResults: {
  response: {
    numFound: number;
    docs: SearchResult[];
  };
  facet_counts: { facet_fields: FetchedFacets };
};

let numFoundResults: {
  response: {
    numFound: number;
  };
};

beforeEach(() => {
  projectResults = [
    {
      name: 'test1',
      facets_url:
        'https://esgf-node.llnl.gov/esg-search/search/?offset=0&limit=0',
    },
    {
      name: 'test2',
      facets_url:
        'https://esgf-node.llnl.gov/esg-search/search/?offset=0&limit=0',
    },
  ];
  searchResults = {
    response: {
      numFound: 2,
      docs: [
        {
          id: 'bar',
          url: ['foo.bar'],
          number_of_files: 3,
          data_node: 'node.gov',
          version: 1,
          size: 1,
          access: ['HTTPServer', 'GridFTP', 'OPENDAP', 'Globus'],
        },
        {
          id: 'bar',
          url: ['foo.bar'],
          number_of_files: 2,
          data_node: 'node.gov',
          version: 1,
          size: 1,
          access: ['HTTPServer', 'GridFTP', 'OPENDAP', 'Globus'],
        },
      ],
    },
    facet_counts: {
      facet_fields: {
        facet1: ['foo', 3, 'bar', 5],
        facet2: ['baz', 2, 'fubar', 3],
      },
    },
  };

  numFoundResults = { response: { numFound: 1 } };

  // Set timeout since some tests run longer than 5000ms
  jest.setTimeout(10000);
});

const location = JSON.stringify(window.location);
afterEach(() => {
  // Routes are already declared in the App component using BrowserRouter, so MemoryRouter does
  // not work to isolate routes in memory between tests. The only workaround is to delete window.location and restore it after each test in order to reset the URL location.
  // More info:
  // - https://stackoverflow.com/a/54222110
  // - https://stackoverflow.com/questions/59892304/cant-get-memoryrouter-to-work-with-testing-library-react
  delete window.location;
  window.location = (JSON.parse(location) as unknown) as Location;

  // Reset all mocks after each test
  jest.clearAllMocks();
});

it('renders App component', async () => {
  const { getByTestId } = render(
    <Router>
      <App />
    </Router>
  );

  // Check all components exist
  expect(getByTestId('nav-bar')).toBeTruthy();
  expect(getByTestId('footer')).toBeTruthy();
  await waitFor(() => expect(getByTestId('facets')).toBeTruthy());
  expect(getByTestId('search')).toBeTruthy();
});

it('handles project changes when a new project is selected', async () => {
  mockAxios.get
    .mockResolvedValueOnce({ data: { results: projectResults } })
    .mockResolvedValueOnce({ data: { results: projectResults } })
    .mockResolvedValueOnce({ data: searchResults })
    .mockResolvedValueOnce({ data: searchResults });

  const { getByPlaceholderText, getByRole, getByTestId, getByText } = render(
    <Router>
      <App />
    </Router>
  );

  // Check navbar rendered with test1 as the default project
  const navBar = await waitFor(() => getByTestId('nav-bar'));
  expect(navBar).toBeTruthy();

  // Change value for free-text input
  const input = 'foo';
  const freeTextInput = await waitFor(() => getByPlaceholderText('Search...'));
  expect(freeTextInput).toBeTruthy();
  fireEvent.change(freeTextInput, { target: { value: input } });

  // Submit the form
  const submitBtn = getByRole('img', { name: 'search' });
  fireEvent.submit(submitBtn);

  // Wait for search to re-render
  await waitFor(() => getByTestId('search'));

  // Change the value for free-text input to 'foo' again and submit
  fireEvent.change(freeTextInput, { target: { value: input } });
  fireEvent.submit(submitBtn);

  // Check error message appears that input has already been applied
  const errorMsg = await waitFor(() =>
    getByText(`Input "${input}" has already been applied`)
  );
  expect(errorMsg).toBeTruthy();
});

it('handles adding and removing items from the cart', async () => {
  // Mock axios initially with chained calls
  mockAxios.get
    .mockResolvedValueOnce({ data: { results: projectResults } })
    .mockResolvedValueOnce({ data: { results: projectResults } })
    .mockResolvedValueOnce({ data: searchResults })
    .mockResolvedValueOnce({ data: searchResults });

  const { getByRole, getByTestId, getByText, getByPlaceholderText } = render(
    <Router>
      <App />
    </Router>
  );

  // Check nav-bar component exists
  await waitFor(() => expect(getByTestId('facets')).toBeTruthy());
  await waitFor(() => expect(getByTestId('nav-bar')).toBeTruthy());

  // Change value for free-text input
  const input = 'foo';
  const freeTextInput = await waitFor(() => getByPlaceholderText('Search...'));
  expect(freeTextInput).toBeTruthy();
  fireEvent.change(freeTextInput, { target: { value: input } });

  // Submit the form
  const submitBtn = getByRole('img', { name: 'search' });
  fireEvent.submit(submitBtn);

  // Wait for search to re-render
  await waitFor(() => getByTestId('search'));

  // Check first row exists
  const firstRow = getByRole('row', {
    name: 'right-circle 3 1 Bytes node.gov 1 HTTPServer download plus',
  });
  expect(firstRow).toBeTruthy();

  // Check first row has add button and click it
  const addBtn = within(firstRow).getByRole('img', { name: 'plus' });
  expect(addBtn).toBeTruthy();
  fireEvent.click(addBtn);

  // Check 'Added items(s) to the cart' message appears
  const addText = await waitFor(() => getByText('Added item(s) to your cart'));
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

it('handles removing search tags and clearing all search tags', async () => {
  // Mock axios initially with chained calls
  mockAxios.get
    .mockResolvedValueOnce({ data: { results: projectResults } })
    .mockResolvedValueOnce({ data: { results: projectResults } })
    .mockResolvedValueOnce({ data: searchResults })
    .mockResolvedValueOnce({ data: searchResults })
    .mockResolvedValueOnce({ data: searchResults })
    .mockResolvedValueOnce({ data: searchResults })
    .mockResolvedValueOnce({ data: searchResults });

  const { getByRole, getByPlaceholderText, getByTestId, getByText } = render(
    <Router>
      <App />
    </Router>
  );

  // Check all components exist
  await waitFor(() => expect(getByTestId('facets')).toBeTruthy());
  await waitFor(() => expect(getByTestId('nav-bar')).toBeTruthy());

  // Change value for free-text input
  const freeTextInput = await waitFor(() => getByPlaceholderText('Search...'));
  expect(freeTextInput).toBeTruthy();
  fireEvent.change(freeTextInput, { target: { value: 'foo' } });

  // Submit the form
  const submitBtn = getByRole('img', { name: 'search' });
  fireEvent.submit(submitBtn);

  // Check foo tag renders
  const fooTag = await waitFor(() => getByTestId('foo'));
  expect(fooTag).toBeTruthy();

  // Click on the ClearAllTag
  const clearAllTag = await waitFor(() => getByText('Clear All'));
  expect(clearAllTag).toBeTruthy();
  fireEvent.click(within(clearAllTag).getByRole('img', { name: 'close' }));

  // Check no project constraints applied text renders
  const noConstraintsText = await waitFor(() =>
    getByText('No project constraints applied')
  );
  expect(noConstraintsText).toBeTruthy();

  // Change value for free-text input and submit again
  fireEvent.change(freeTextInput, { target: { value: 'baz' } });
  fireEvent.submit(submitBtn);

  // Check baz tag exists
  const bazTag = await waitFor(() => getByTestId('baz'));
  expect(bazTag).toBeTruthy();

  // Close the baz tag
  fireEvent.click(within(bazTag).getByRole('img', { name: 'close' }));

  // Check no project constraints applied
  await waitFor(() => expect(noConstraintsText).toBeTruthy());
});

it('handles removing facet tags', async () => {
  // Mock axios initially with chained calls
  mockAxios.get
    .mockResolvedValueOnce({ data: { results: projectResults } })
    .mockResolvedValueOnce({ data: { results: projectResults } })
    .mockResolvedValueOnce({ data: searchResults })
    .mockResolvedValueOnce({ data: searchResults })
    .mockResolvedValueOnce({ data: searchResults });

  const { getByRole, getByTestId, getByText } = render(
    <Router>
      <App />
    </Router>
  );

  // Check all components exist
  const facets = await waitFor(() => getByTestId('facets'));
  expect(facets).toBeTruthy();

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
  const submitBtn = within(facets).getByRole('img', { name: 'select' });
  fireEvent.submit(submitBtn);

  // Check no project constraints applied text renders
  const noConstraintsText = await waitFor(() =>
    getByText('No project constraints applied')
  );
  expect(noConstraintsText).toBeTruthy();

  // Open Collapse Panel in Collapse component for the facet1 form to render
  const collapse = getByText('Facet1');
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

  // Submit the form
  const facetFormBtn = getByRole('button', { name: 'filter Apply Facets' });
  expect(facetFormBtn).toBeTruthy();
  fireEvent.click(facetFormBtn);

  // Check foo tag exists
  const fooTag = await waitFor(() => getByTestId('foo'));
  expect(fooTag).toBeTruthy();

  // Close the baz tag
  fireEvent.click(within(fooTag).getByRole('img', { name: 'close' }));

  // Check no project constraints applied
  await waitFor(() => expect(noConstraintsText).toBeTruthy());
});

it('handles project changes and clearing constraints when the active project !== selected project', async () => {
  // Mock axios initially with chained calls
  mockAxios.get
    .mockResolvedValueOnce({ data: { results: projectResults } })
    .mockResolvedValueOnce({ data: { results: projectResults } })
    .mockResolvedValueOnce({ data: searchResults });

  const { getByTestId } = render(
    <Router>
      <App />
    </Router>
  );

  // Check facet component renders
  const facets = await waitFor(() => getByTestId('facets'));
  expect(facets).toBeTruthy();

  // Check project select form exists and mouseDown to expand list of options
  const projectFormSelect = document.querySelector(
    '[data-testid=project-form-select] > .ant-select-selector'
  ) as HTMLFormElement;
  expect(projectFormSelect).toBeTruthy();
  fireEvent.mouseDown(projectFormSelect);

  // Select the first project option
  const projectOption = getByTestId('project_0');
  expect(projectOption).toBeInTheDocument();
  fireEvent.click(projectOption);

  // Submit the form
  const submitBtn = within(facets).getByRole('img', { name: 'select' });
  fireEvent.submit(submitBtn);

  // Wait for search to re-render with results for project_0
  await waitFor(() => getByTestId('search'));

  // Check project select form exists again and mouseDown to expand list of options
  const projectFormSelect2 = document.querySelector(
    '[data-testid=project-form-select] > .ant-select-selector'
  ) as HTMLFormElement;
  expect(projectFormSelect).toBeTruthy();
  fireEvent.mouseDown(projectFormSelect2);

  // Select the second project option
  const secondOption = getByTestId('project_1');
  expect(secondOption).toBeInTheDocument();
  fireEvent.click(secondOption);

  // Submit the form
  fireEvent.submit(submitBtn);

  // Wait for search to re-render with results for project_1
  await waitFor(() => getByTestId('search'));
});

it('displays the number of files in the cart summary and handles clearing the cart', async () => {
  // Mock axios initially with chained calls
  mockAxios.get
    .mockResolvedValueOnce({ data: { results: projectResults } })
    .mockResolvedValueOnce({ data: { results: projectResults } })
    .mockResolvedValueOnce({ data: searchResults })
    .mockResolvedValueOnce({ data: searchResults });

  const { getByRole, getByTestId, getByText, getByPlaceholderText } = render(
    <Router>
      <App />
    </Router>
  );

  // Check nav-bar component exists
  const navBar = await waitFor(() => getByTestId('nav-bar'));
  expect(navBar).toBeTruthy();

  // Change value for free-text input
  const input = 'foo';
  const freeTextInput = getByPlaceholderText('Search...');
  expect(freeTextInput).toBeTruthy();
  fireEvent.change(freeTextInput, { target: { value: input } });

  // Submit the form
  const submitBtn = getByRole('img', { name: 'search' });
  fireEvent.submit(submitBtn);

  // Wait for search to re-render
  await waitFor(() => getByTestId('search'));

  // Check first row exists
  const firstRow = getByRole('row', {
    name: 'right-circle 3 1 Bytes node.gov 1 HTTPServer download plus',
  });
  expect(firstRow).toBeTruthy();

  // Check first row has add button and click it
  const addBtn = within(firstRow).getByRole('img', { name: 'plus' });
  expect(addBtn).toBeTruthy();
  fireEvent.click(addBtn);

  // Check 'Added item(s) to your cart' message appears
  const addText = await waitFor(() => getByText('Added item(s) to your cart'));
  expect(addText).toBeTruthy();

  // Click on the cart link
  const cartLink = getByRole('link', { name: 'shopping-cart 1' });
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

it('handles removing searches from the search library', async () => {
  // Mock axios initially with chained calls
  mockAxios.get
    .mockResolvedValueOnce({ data: { results: projectResults } })
    .mockResolvedValueOnce({ data: { results: projectResults } })
    .mockResolvedValueOnce({ data: searchResults })
    .mockResolvedValueOnce({ data: searchResults })
    .mockResolvedValueOnce({ data: numFoundResults });
  const {
    getByRole,
    getByTestId,
    getByText,
    getByPlaceholderText,
    queryByText,
  } = render(
    <Router>
      <App />
    </Router>
  );

  // Check nav-bar component exists
  const navBar = await waitFor(() => getByTestId('nav-bar'));
  expect(navBar).toBeTruthy();

  // Change value for free-text input
  const input = 'foo';
  const freeTextInput = getByPlaceholderText('Search...');
  expect(freeTextInput).toBeTruthy();
  fireEvent.change(freeTextInput, { target: { value: input } });

  // Submit the form
  const submitBtn = getByRole('img', { name: 'search' });
  fireEvent.submit(submitBtn);

  // Wait for search to re-render
  await waitFor(() => getByTestId('search'));

  // Check Save Search Criteria button exists and click it
  const saveSearch = getByRole('button', { name: 'book Save Search Criteria' });
  expect(saveSearch).toBeTruthy();
  fireEvent.click(saveSearch);

  // Check added message appears
  const addText = await waitFor(() =>
    getByText('Saved search criteria to your library')
  );
  expect(addText).toBeTruthy();

  // Click on the search library link
  const searchLibraryLink = getByRole('link', { name: 'book 1' });
  expect(searchLibraryLink).toBeTruthy();
  fireEvent.click(searchLibraryLink);

  // Check number of files and datasets are correctly displayed
  const cart = await waitFor(() => getByTestId('cart'));
  expect(cart).toBeTruthy();

  // Check that the search library is not empty
  const queryEmptyText = queryByText('Your search library is empty');
  expect(queryEmptyText).toBeNull();

  // Check delete button renders and click it
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

it('handles saving and applying searches to and from the search library to render results', async () => {
  // Mock axios initially with chained calls
  mockAxios.get
    .mockResolvedValueOnce({ data: { results: projectResults } })
    .mockResolvedValueOnce({ data: { results: projectResults } })
    .mockResolvedValueOnce({ data: searchResults })
    .mockResolvedValueOnce({ data: searchResults })
    .mockResolvedValueOnce({ data: numFoundResults })
    .mockResolvedValueOnce({ data: { results: projectResults } })
    .mockResolvedValueOnce({ data: searchResults });

  const { getByRole, getByTestId, getByPlaceholderText, queryByText } = render(
    <Router>
      <App />
    </Router>
  );

  // Check nav-bar component exists
  const navBar = await waitFor(() => getByTestId('nav-bar'));
  expect(navBar).toBeTruthy();

  // Change value for free-text input
  const input = 'foo';
  const freeTextInput = getByPlaceholderText('Search...');
  expect(freeTextInput).toBeTruthy();
  fireEvent.change(freeTextInput, { target: { value: input } });

  // Submit the form
  const submitBtn = getByRole('img', { name: 'search' });
  fireEvent.submit(submitBtn);

  // Wait for search to re-render
  await waitFor(() => getByTestId('search'));

  // Check Save Search Criteria button exists and click it
  const saveSearch = getByRole('button', { name: 'book Save Search Criteria' });
  expect(saveSearch).toBeTruthy();
  fireEvent.click(saveSearch);

  // Click on the search library link
  const searchLibraryLink = getByRole('link', { name: 'book 1' });
  expect(searchLibraryLink).toBeTruthy();
  fireEvent.click(searchLibraryLink);

  // Check number of files and datasets are correctly displayed
  const cart = await waitFor(() => getByTestId('cart'));
  expect(cart).toBeTruthy();

  // Check that the search library is not empty
  const queryEmptyText = queryByText('Your search library is empty');
  expect(queryEmptyText).toBeNull();

  // Check apply search button renders and click it
  const applyBtn = await waitFor(() =>
    within(cart).getByRole('img', { name: 'search', hidden: true })
  );
  expect(applyBtn).toBeTruthy();
  fireEvent.click(applyBtn);

  // Wait for search to re-render
  await waitFor(() => getByTestId('search'));
});

it('handles saving multiple searches', async () => {
  // Mock axios initially with chained calls
  mockAxios.get
    .mockResolvedValueOnce({ data: { results: projectResults } })
    .mockResolvedValueOnce({ data: { results: projectResults } })
    .mockResolvedValueOnce({ data: searchResults })
    .mockResolvedValueOnce({ data: searchResults });

  const { getByRole, getByTestId, getByPlaceholderText, getByText } = render(
    <Router>
      <App />
    </Router>
  );

  // Check nav-bar component exists
  const navBar = await waitFor(() => getByTestId('nav-bar'));
  expect(navBar).toBeTruthy();

  // Change value for free-text input
  const input = 'foo';
  const freeTextInput = getByPlaceholderText('Search...');
  expect(freeTextInput).toBeTruthy();
  fireEvent.change(freeTextInput, { target: { value: input } });

  // Submit the form
  const submitBtn = getByRole('img', { name: 'search' });
  fireEvent.submit(submitBtn);

  // Wait for search to re-render
  await waitFor(() => getByTestId('search'));

  // Check save button exists and click it
  const saveSearch = getByRole('button', { name: 'book Save Search Criteria' });
  expect(saveSearch).toBeTruthy();
  fireEvent.click(saveSearch);

  // Click on button again
  fireEvent.click(saveSearch);

  // Check alert appears showing search already saved
  const alreadySavedAlert = await waitFor(() =>
    getByText('This search has already been saved.')
  );
  expect(alreadySavedAlert).toBeTruthy();

  // Change free-text input and submit to save another search
  fireEvent.change(freeTextInput, { target: { value: input } });
  fireEvent.click(saveSearch);

  // Wait for search to re-render
  await waitFor(() => getByTestId('search'));
});
