/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { render } from '@testing-library/react';

import Summary, { Props } from './Summary';
import { cartFixture } from '../../api/mock/fixtures';

const defaultProps: Props = {
  cart: cartFixture(),
};

test('renders without crashing', () => {
  const { getByTestId } = render(
    <Router>
      <Summary {...defaultProps} />
    </Router>
  );
  expect(getByTestId('summary')).toBeTruthy();
});

it('shows the correct number of datasets and files', () => {
  const { getByText } = render(
    <Router>
      <Summary {...defaultProps} />
    </Router>
  );
  // Shows number of files
  expect(
    getByText((_, node) => node.textContent === 'Number of Datasets: 2')
  ).toBeTruthy();
  expect(
    getByText((_, node) => node.textContent === 'Number of Files: 5')
  ).toBeTruthy();
});
