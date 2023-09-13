/**
 * This file contains tests for the App component.
 *
 * The App component uses React Router and React Context, so it must be wrapped
 * in order to mock their behaviors.
 *
 */
import {
  waitFor,
  within,
  screen,
  RenderResult,
  fireEvent,
} from '@testing-library/react';
import { UserEvent } from '@testing-library/user-event/dist/types/setup/setup';

export function printElementContents(element: HTMLElement | undefined): void {
  screen.debug(element, Number.POSITIVE_INFINITY);
}

/**
 * Creates the appropriate name string when performing getByRole('row')
 */
export function getRowName(
  cartButton: 'plus' | 'minus',
  nodeCircleType: 'question' | 'check' | 'close',
  title: string,
  fileCount: string,
  totalSize: string,
  version: string,
  globusReady?: boolean
): RegExp {
  let totalBytes = `${totalSize} Bytes`;
  if (Number.isNaN(Number(totalSize))) {
    totalBytes = totalSize;
  }
  let globusReadyCheck = '.*';
  if (globusReady !== undefined) {
    globusReadyCheck = globusReady ? 'check-circle' : 'close-circle';
  }
  const newRegEx = new RegExp(
    `right-circle ${cartButton} ${nodeCircleType}-circle ${title} ${fileCount} ${totalBytes} ${version} wget download ${globusReadyCheck}`
  );

  return newRegEx;
}

export async function submitKeywordSearch(
  renderedApp: RenderResult,
  inputText: string,
  user: UserEvent
): Promise<void> {
  const { getByTestId, getByPlaceholderText } = renderedApp;

  // Check left menu rendered
  const leftMenuComponent = await waitFor(() => getByTestId('left-menu'));
  expect(leftMenuComponent).toBeTruthy();

  // Type in value for free-text input
  const freeTextForm = await waitFor(() =>
    getByPlaceholderText('Search for a keyword')
  );
  expect(freeTextForm).toBeTruthy();
  await user.type(freeTextForm, inputText);

  // Submit the form
  const submitBtn = within(leftMenuComponent).getByRole('img', {
    name: 'search',
  });
  await user.click(submitBtn);

  await waitFor(() => getByTestId('search'));
}

export async function selectProjectFromProjectDropdown(
  renderedApp: RenderResult,
  projectTestId: string,
  user: UserEvent
): Promise<void> {
  const { getByTestId } = renderedApp;

  // Check applicable components render
  const facetsComponent = await waitFor(() => getByTestId('search-facets'));
  expect(facetsComponent).toBeTruthy();

  // Wait for project form to render
  const projectForm = await waitFor(() => getByTestId('project-form'));
  expect(projectForm).toBeTruthy();

  // Check project select form exists and mouseDown to expand list of options to expand options
  const projectFormSelect = within(projectForm).getByRole('combobox');
  expect(projectFormSelect).toBeTruthy();
  fireEvent.mouseDown(projectFormSelect);

  // Select a project option
  const projectOption = getByTestId(projectTestId);
  expect(projectOption).toBeTruthy();
  await user.click(projectOption);

  // Submit the form
  const submitBtn = within(facetsComponent).getByRole('img', {
    name: 'select',
  });
  fireEvent.submit(submitBtn);

  // Wait for components to rerender
  await waitFor(() => getByTestId('search'));
  await waitFor(() => getByTestId('search-facets'));
}

export async function addFirstRowItemToCart(
  renderedApp: RenderResult,
  user: UserEvent
): Promise<void> {
  const { getByTestId, getByRole, getByText } = renderedApp;
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
  const addText = await waitFor(() => getByText('Added item(s) to your cart'));
  expect(addText).toBeTruthy();
}
