import React from 'react';
import { screen } from '@testing-library/react';
import { userSearchQueriesFixture } from '../../test/mock/fixtures';
import Searches, { Props } from './Searches';
import customRender from '../../test/custom-render';

afterEach(() => {
  jest.clearAllMocks();
});

const defaultProps: Props = {
  userSearchQueries: userSearchQueriesFixture(),
  onRemoveSearchQuery: jest.fn(),
};

it('renders component with empty savedSearches', async () => {
  customRender(<Searches {...defaultProps} userSearchQueries={[]} />);

  const emptyText = await screen.findByText('Your search library is empty');
  expect(emptyText).toBeTruthy();
});
