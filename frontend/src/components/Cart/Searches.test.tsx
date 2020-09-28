import { render } from '@testing-library/react';
import React from 'react';
import { userSearchQueriesFixture } from '../../api/mock/fixtures';
import Searches, { Props } from './Searches';

afterEach(() => {
  jest.clearAllMocks();
});

const defaultProps: Props = {
  userSearchQueries: userSearchQueriesFixture(),
  onRunSearchQuery: jest.fn(),
  onRemoveSearchQuery: jest.fn(),
};

it('renders component with empty savedSearches', () => {
  const { getByText } = render(
    <Searches {...defaultProps} userSearchQueries={[]} />
  );

  const emptyText = getByText('Your search library is empty');
  expect(emptyText).toBeTruthy();
});
