import React from 'react';
import { userSearchQueriesFixture } from '../../api/mock/fixtures';
import Searches, { Props } from './Searches';
import { customRenderKeycloak } from '../../test/custom-render';

afterEach(() => {
  jest.clearAllMocks();
});

const defaultProps: Props = {
  userSearchQueries: userSearchQueriesFixture(),
  onRunSearchQuery: jest.fn(),
  onRemoveSearchQuery: jest.fn(),
};

it('renders component with empty savedSearches', () => {
  const { getByText } = customRenderKeycloak(
    <Searches {...defaultProps} userSearchQueries={[]} />
  );

  const emptyText = getByText('Your search library is empty');
  expect(emptyText).toBeTruthy();
});
