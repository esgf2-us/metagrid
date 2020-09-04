import { render } from '@testing-library/react';
import React from 'react';
import { savedSearchesFixture } from '../../api/mock/fixtures';
import Searches, { Props } from './Searches';

afterEach(() => {
  jest.clearAllMocks();
});

const defaultProps: Props = {
  savedSearches: savedSearchesFixture(),
  handleRemoveSearch: jest.fn(),
  handleApplySearch: jest.fn(),
};

it('renders component with empty savedSearches', () => {
  const { getByText } = render(
    <Searches {...defaultProps} savedSearches={[]} />
  );

  const emptyText = getByText('Your search library is empty');
  expect(emptyText).toBeTruthy();
});
