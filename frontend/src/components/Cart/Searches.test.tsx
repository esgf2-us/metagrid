/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { render } from '@testing-library/react';

import Searches, { Props } from './Searches';
import { savedSearchesFixture } from '../../test/fixtures';

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
