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
  expect(getByText('2')).toBeTruthy();
  expect(getByText('5')).toBeTruthy();
});

it('handles the download form submission with handleOnFinish()', () => {
  const { getByRole } = render(
    <Router>
      <Summary {...defaultProps} />
    </Router>
  );
  // Shows number of files
  const downloadBtn = getByRole('img', { name: 'download' });
  fireEvent.submit(downloadBtn);
});
