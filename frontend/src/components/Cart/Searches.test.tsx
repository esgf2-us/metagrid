import React from 'react';
import { userSearchQueriesFixture } from '../../api/mock/fixtures';
import Searches, { Props } from './Searches';
import customRender from '../../test/custom-render';

afterEach(() => {
  jest.clearAllMocks();
});

const defaultProps: Props = {
  userSearchQueries: userSearchQueriesFixture(),
  onRunSearchQuery: jest.fn(),
  onRemoveSearchQuery: jest.fn(),
};

it('renders component with empty savedSearches', async () => {
  const { findByText } = customRender(
    <Searches {...defaultProps} userSearchQueries={[]} />
  );

  const emptyText = await findByText('Your search library is empty');
  expect(emptyText).toBeTruthy();
});
