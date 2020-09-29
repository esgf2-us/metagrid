import { render } from '@testing-library/react';
import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { userCartFixture } from '../../api/mock/fixtures';
import Summary, { Props } from './Summary';

const defaultProps: Props = {
  userCart: userCartFixture(),
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
