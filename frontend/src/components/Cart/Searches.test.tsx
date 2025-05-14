import React from 'react';
import { screen } from '@testing-library/react';
import Searches from './Searches';
import customRender from '../../test/custom-render';
import { userSearchQueryFixture } from '../../test/mock/fixtures';
import userEvent from '@testing-library/user-event';
import { AppStateKeys } from '../../common/atoms';
import { AtomWrapper, getFromLocalStorage } from '../../test/jestTestFunctions';
import { UserSearchQueries } from './types';

afterEach(() => {
  jest.clearAllMocks();
});

it('renders component with empty savedSearches', async () => {
  AtomWrapper.modifyAtomValue(AppStateKeys.userSearchQueries, []);
  customRender(<Searches />);

  const emptyText = await screen.findByText('Your search library is empty');
  expect(emptyText).toBeTruthy();
});

it('removes a search query when user is not authenticated', async () => {
  const firstQuery = userSearchQueryFixture({ uuid: '1', filenameVars: [] });
  const secondQuery = userSearchQueryFixture({ uuid: '2' });
  AtomWrapper.modifyAtomValue(AppStateKeys.userSearchQueries, [firstQuery, secondQuery]);
  customRender(<Searches />, { usesAtoms: true, authenticated: false });

  // Verify user queries count is 2
  const userQueries: [] = getFromLocalStorage(AppStateKeys.userSearchQueries) || [];
  expect(userQueries.length).toEqual(2);

  const removeButton = await screen.findByTestId('remove-1'); // Assuming the button has a test ID
  await userEvent.click(removeButton);

  // Verify user queries count is now 1 and that it is 2nd query
  const userQueriesUpdated: UserSearchQueries =
    getFromLocalStorage(AppStateKeys.userSearchQueries) || [];
  expect(userQueriesUpdated.length).toEqual(1);
  expect(userQueriesUpdated[0].uuid).toEqual(secondQuery.uuid);
});
