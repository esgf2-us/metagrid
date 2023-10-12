import React from 'react';
import userEvent from '@testing-library/user-event';
import { cleanup, fireEvent, waitFor, within } from '@testing-library/react';
import { customRender } from '../../test/custom-render';
import DatasetDownloadForm from './DatasetDownload';
import { loadSessionValue } from '../../api';
import { server } from '../../api/mock/server';
import { getSearchFromUrl } from '../../common/utils';
import { ActiveSearchQuery } from '../Search/types';
import { getRowName, printElementContents } from '../../test/jestTestFunctions';
import App from '../App/App';

// Used to restore window.location after each test
const location = JSON.stringify(window.location);

const activeSearch: ActiveSearchQuery = getSearchFromUrl();

const user = userEvent.setup();

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

  server.resetHandlers();

  cleanup();
});

const mockLoadSessionValue = loadSessionValue as jest.MockedFunction<
  typeof loadSessionValue
>;

describe('Download form tests', () => {
  it('Download form renders.', () => {
    const downloadForm = customRender(<DatasetDownloadForm />);
    expect(downloadForm).toBeTruthy();

    mockLoadSessionValue.mockResolvedValue(true);
    expect(downloadForm).toBeTruthy();
  });

  it('Performs a wget download from the dropdown', async () => {
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
    await user.click(addBtn);

    // Check 'Added items(s) to the cart' message appears
    const addText = await waitFor(() =>
      getByText('Added item(s) to your cart')
    );
    expect(addText).toBeTruthy();

    // Check first row has add button and click it
    const cartBtn = getByRole('menuitem', { name: 'shopping-cart 1 Cart' });
    expect(cartBtn).toBeTruthy();
    await user.click(cartBtn);

    // Click the wget download option
    printElementContents(undefined);
  });
});
