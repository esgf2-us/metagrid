/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { fireEvent, render } from '@testing-library/react';

import Summary from './Summary';

const defaultProps = {
  numItems: 2,
  numFiles: 5,
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

it('handles the download form submission with handleOnFinish()', () => {
  const { getByRole } = render(
    <Router>
      <Summary {...defaultProps} />
    </Router>
  );

  // Check download button renders and click it
  const downloadBtn = getByRole('img', { name: 'download' });
  expect(downloadBtn).toBeTruthy();
  fireEvent.submit(downloadBtn);
});
