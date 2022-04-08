import { render } from '@testing-library/react';
import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import {
  rawSearchResultFixture,
  userCartFixture,
} from '../../api/mock/fixtures';
import Summary, { Props } from './Summary';

const defaultProps: Props = {
  userCart: userCartFixture(),
};

test('renders component', () => {
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
    getByText(
      (_, node) => node!.textContent === 'Number of Datasets: 2'
    )
  ).toBeTruthy();
  expect(
    getByText(
      (_, node) => node!.textContent === 'Number of Files: 5'
    )
  ).toBeTruthy();
});

it('renders component with correct calculations when a dataset doesn"t have size or number_of_files attributes', () => {
  const { getByText } = render(
    <Router>
      <Summary
        userCart={[
          rawSearchResultFixture(),
          rawSearchResultFixture({
            size: undefined,
            number_of_files: undefined,
          }),
        ]}
      />
    </Router>
  );
  // Shows number of files
  expect(
    getByText(
      (_, node) => node!.textContent === 'Number of Datasets: 2'
    )
  ).toBeTruthy();
  expect(
    getByText(
      (_, node) => node!.textContent === 'Number of Files: 3'
    )
  ).toBeTruthy();
});
