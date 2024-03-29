import React from 'react';
import {
  rawSearchResultFixture,
  userCartFixture,
} from '../../api/mock/fixtures';
import Summary, { Props } from './Summary';
import customRender from '../../test/custom-render';

const defaultProps: Props = {
  userCart: userCartFixture(),
};

test('renders component', () => {
  const { getByTestId } = customRender(<Summary {...defaultProps} />);
  expect(getByTestId('summary')).toBeTruthy();
});

it('shows the correct number of datasets and files', () => {
  const { getByText } = customRender(<Summary {...defaultProps} />);
  // Shows number of files
  const numDatasetsField = getByText('Number of Datasets:');
  const numFilesText = getByText('Number of Files:');

  expect(numDatasetsField.textContent).toEqual('Number of Datasets: 3');
  expect(numFilesText.textContent).toEqual('Number of Files: 8');
});

it('renders component with correct calculations when a dataset doesn"t have size or number_of_files attributes', () => {
  const { getByText } = customRender(
    <Summary
      userCart={[
        rawSearchResultFixture(),
        rawSearchResultFixture({
          size: undefined,
          number_of_files: undefined,
        }),
      ]}
    />
  );
  // Shows number of files
  const numDatasetsField = getByText('Number of Datasets:');
  const numFilesText = getByText('Number of Files:');

  expect(numDatasetsField.textContent).toEqual('Number of Datasets: 2');
  expect(numFilesText.textContent).toEqual('Number of Files: 3');
});
