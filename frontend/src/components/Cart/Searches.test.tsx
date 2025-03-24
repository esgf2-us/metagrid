import React from 'react';
import { screen } from '@testing-library/react';
import Searches from './Searches';
import customRender from '../../test/custom-render';
import { getFromLocalStorage, RecoilWrapper } from '../../test/jestTestFunctions';
import { userSearchQueriesAtom } from '../App/recoil/atoms';
import { userSearchQueryFixture } from '../../test/mock/fixtures';
import userEvent from '@testing-library/user-event';

afterEach(() => {
  jest.clearAllMocks();
});

it('renders component with empty savedSearches', async () => {
  RecoilWrapper.modifyAtomValue(userSearchQueriesAtom.key, []);
  customRender(<Searches />);

  const emptyText = await screen.findByText('Your search library is empty');
  expect(emptyText).toBeTruthy();
});

it('removes a search query when user is not authenticated', async () => {
  RecoilWrapper.modifyAtomValue(userSearchQueriesAtom.key, [
    userSearchQueryFixture({ uuid: '1', filenameVars: [] }),
    userSearchQueryFixture({ uuid: '2' }),
  ]);
  customRender(<Searches />, { usesRecoil: true, authenticated: false });

  const removeButton = await screen.findByTestId('remove-1'); // Assuming the button has a test ID
  await userEvent.click(removeButton);

  const updatedSearchQueries = getFromLocalStorage(userSearchQueriesAtom.key);
  expect(updatedSearchQueries).toEqual([userSearchQueryFixture({ uuid: '2' })]);
});
