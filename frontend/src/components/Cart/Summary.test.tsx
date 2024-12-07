import React from 'react';
import { screen } from '@testing-library/react';
import { rawSearchResultFixture, userCartFixture } from '../../test/mock/fixtures';
import Summary, { Props } from './Summary';
import customRender from '../../test/custom-render';

const defaultProps: Props = {
  userCart: userCartFixture(),
};

test('renders component', async () => {
  customRender(<Summary {...defaultProps} />);
  expect(await screen.findByTestId('summary')).toBeTruthy();
});

it('shows the correct number of datasets and files', async () => {
  customRender(<Summary {...defaultProps} />);
  // Shows number of files
  const numDatasetsField = await screen.findByText('Number of Datasets:');
  const numFilesText = await screen.findByText('Number of Files:');

  expect(numDatasetsField.textContent).toEqual('Number of Datasets: 3');
  expect(numFilesText.textContent).toEqual('Number of Files: 8');
});

it('renders component with correct calculations when a dataset doesn"t have size or number_of_files attributes', async () => {
  customRender(
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
  const numDatasetsField = await screen.findByText('Number of Datasets:');
  const numFilesText = await screen.findByText('Number of Files:');

  expect(numDatasetsField.textContent).toEqual('Number of Datasets: 2');
  expect(numFilesText.textContent).toEqual('Number of Files: 3');
});
