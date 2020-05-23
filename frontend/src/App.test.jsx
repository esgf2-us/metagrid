import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { render, waitFor, fireEvent, within } from '@testing-library/react';

import App from './App';
import mockAxios from './__mocks__/axios';

let projectResults;
let searchResults;

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
          url: undefined,
          number_of_files: 3,
          data_node: 'node.gov',
          version: 1,
          access: ['HTTPServer', 'GridFTP', 'OPENDAP', 'Globus'],
        },
        {
          id: 'bar',
          url: undefined,
          number_of_files: 2,
          data_node: 'node.gov',
          version: 1,
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
});

// Reset all mocks after each test
afterEach(() => {
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
  // Mock projects initially
  mockAxios.get.mockImplementationOnce(() =>
    Promise.resolve({
      data: { results: projectResults },
    })
  );
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
  // Chain mocks based on firing events
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
    name: 'right-circle 3 node.gov 1 HTTPServer download plus',
  });
  expect(firstRow).toBeTruthy();

  // Check first row has add button and click it
  const addBtn = within(firstRow).getByRole('img', { name: 'plus' });
  expect(addBtn).toBeTruthy();
  fireEvent.click(addBtn);

  // Check 'Added items to the cart' message appears
  const addText = await waitFor(() => getByText('Added items to the cart'));
  expect(addText).toBeTruthy();

  // Check first row has remove button and click it
  const removeBtn = within(firstRow).getByRole('img', { name: 'minus' });
  expect(removeBtn).toBeTruthy();
  fireEvent.click(removeBtn);

  // Check 'Removed items from the cart' message appears
  const removeText = await waitFor(() =>
    getByText('Removed items from the cart')
  );
  expect(removeText).toBeTruthy();
});

it('handles removing search tags and clearing all search tags', async () => {
  // Chain mocks based on firing events
  mockAxios.get
    .mockResolvedValueOnce({ data: { results: projectResults } })
    .mockResolvedValueOnce({ data: { results: projectResults } })
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

  // Check no constraints applied text renders
  const noConstraintsText = await waitFor(() =>
    getByText('No constraints applied')
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

  // Check no constraints applied
  await waitFor(() => expect(noConstraintsText).toBeTruthy());
});

it('handles removing facet tags', async () => {
  // Chain mocks based on firing events
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

  // Change value for projectForm inside facets component
  const projectForm = within(facets).getByRole('combobox');
  expect(projectForm).toBeTruthy();
  fireEvent.change(projectForm, { target: { value: 'foo' } });

  // Select the first project option
  const projectOption = getByTestId('project_0');
  expect(projectOption).toBeTruthy();
  fireEvent.click(projectOption);

  // Submit the form
  const submitBtn = within(facets).getByRole('img', { name: 'select' });
  fireEvent.submit(submitBtn);

  // Check no constraints applied text renders
  const noConstraintsText = await waitFor(() =>
    getByText('No constraints applied')
  );
  expect(noConstraintsText).toBeTruthy();

  // Open Collapse Panel in Collapse component for the facet1 form to render
  const collapse = getByText('Facet1');
  fireEvent.click(collapse);

  // Change the value of the Select (combobox) in order for the options to
  // render on the DOM.
  const facet1Form = await waitFor(() => getByTestId('facet1_form'));
  const formField = within(facet1Form).getByRole('combobox');
  expect(formField).toBeTruthy();
  fireEvent.change(formField, { target: { value: 'foo' } });

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

  // Check no constraints applied
  await waitFor(() => expect(noConstraintsText).toBeTruthy());
});

it('handles project changes and clearing constraints when the active project !== selected project', async () => {
  // Chain mocks based on firing events
  mockAxios.get
    .mockResolvedValueOnce({ data: { results: projectResults } })
    .mockResolvedValueOnce({ data: { results: projectResults } })
    .mockResolvedValueOnce({ data: searchResults })
    .mockResolvedValueOnce({ data: searchResults });

  const { getByTestId } = render(
    <Router>
      <App />
    </Router>
  );

  // Check Facets component renders
  const facets = await waitFor(() => getByTestId('facets'));
  expect(facets).toBeTruthy();

  // Check projectForm renders
  const projectForm = await waitFor(() => getByTestId('projectForm'));
  expect(projectForm).toBeTruthy();

  // Update value of projectForm combobox
  const projectFormCombo = within(projectForm).getByRole('combobox');
  expect(projectFormCombo).toBeTruthy();
  fireEvent.change(projectFormCombo, { target: { value: 'foo' } });

  // Select the first project option
  const projectOption = await waitFor(() => getByTestId('project_0'));
  expect(projectOption).toBeTruthy();
  fireEvent.click(projectOption);

  // Submit the form
  const submitBtn = within(facets).getByRole('img', { name: 'select' });
  fireEvent.submit(submitBtn);

  // Wait for Search component to re-render
  await waitFor(() => getByTestId('search'));

  // Update value of projectForm combobox again
  const projectFormCombo2 = within(projectForm).getByRole('combobox');
  expect(projectFormCombo2).toBeTruthy();
  fireEvent.change(projectFormCombo2, { target: { value: 'bar' } });

  // Select the second project option
  const secondOption = await waitFor(() => getByTestId('project_1'));
  expect(secondOption).toBeTruthy();
  fireEvent.click(secondOption);

  // Submit the form
  fireEvent.submit(submitBtn);

  // Wait for Search component to re-render
  await waitFor(() => getByTestId('search'));
});

it('displays the number of files in the cart summary and handles clearing the cart', async () => {
  // Chain mocks based on firing events
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
    name: 'right-circle 3 node.gov 1 HTTPServer download plus',
  });
  expect(firstRow).toBeTruthy();

  // Check first row has add button and click it
  const addBtn = within(firstRow).getByRole('img', { name: 'plus' });
  expect(addBtn).toBeTruthy();
  fireEvent.click(addBtn);

  // Check 'Added items to the cart' message appears
  const addText = await waitFor(() => getByText('Added items to the cart'));
  expect(addText).toBeTruthy();

  // Click on the cart link
  const cartLink = getByRole('link', { name: 'shopping-cart 1' });
  expect(cartLink).toBeTruthy();
  fireEvent.click(cartLink);

  // Check current route is '/cart'
  global.window = { location: { pathname: null } };
  expect(global.window.location.pathname).toEqual('/cart');

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
  const emptyAlert = getByRole('img', { name: 'info-circle' });
  expect(emptyAlert).toBeTruthy();
});
