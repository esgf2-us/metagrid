import React from 'react';
import { screen } from '@testing-library/react';
import Searches from './Searches';
import customRender from '../../test/custom-render';
import { userSearchQueryFixture } from '../../test/mock/fixtures';
import userEvent from '@testing-library/user-event';
import { AppStateKeys } from '../../common/atoms';
import { AtomWrapper, getFromLocalStorage } from '../../test/jestTestFunctions';

afterEach(() => {
  jest.clearAllMocks();
});

it('renders component with empty savedSearches', async () => {
  AtomWrapper.modifyAtomValue(AppStateKeys.userSearchQuery, []);
  customRender(<Searches />);

  const emptyText = await screen.findByText('Your search library is empty');
  expect(emptyText).toBeTruthy();
});

it('removes a search query when user is not authenticated', async () => {
  AtomWrapper.modifyAtomValue(AppStateKeys.userSearchQuery, [
    userSearchQueryFixture({ uuid: '1', filenameVars: [] }),
    userSearchQueryFixture({ uuid: '2' }),
  ]);
  customRender(<Searches />, { usesAtoms: true, authenticated: false });

  const removeButton = await screen.findByTestId('remove-1'); // Assuming the button has a test ID
  await userEvent.click(removeButton);

  const updatedSearchQueries = getFromLocalStorage(AppStateKeys.userSearchQuery);
  expect(updatedSearchQueries).toEqual([userSearchQueryFixture({ uuid: '2' })]);
});
