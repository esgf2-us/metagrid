import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rawSearchResultFixture, userCartFixture } from '../../test/mock/fixtures';
import Summary, { Props } from './Summary';
import customRender from '../../test/custom-render';
import { CartStateKeys, GlobusStateKeys } from '../../common/atoms';
import { AtomWrapper } from '../../test/jestTestFunctions';

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
  const numDatasetsField = await screen.findByText('Total Number of Datasets:');
  const numFilesText = await screen.findByText('Total Number of Files:');

  expect(numDatasetsField.textContent).toEqual('Total Number of Datasets: 3');
  expect(numFilesText.textContent).toEqual('Total Number of Files: 8');
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
  const numDatasetsField = await screen.findByText('Total Number of Datasets:');
  const numFilesText = await screen.findByText('Total Number of Files:');

  expect(numDatasetsField.textContent).toEqual('Total Number of Datasets: 2');
  expect(numFilesText.textContent).toEqual('Total Number of Files: 3');
});

it('handles undefined number_of_files and size attributes gracefully', async () => {
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
  const numDatasetsField = await screen.findByText('Total Number of Datasets:');
  const numFilesText = await screen.findByText('Total Number of Files:');

  expect(numDatasetsField.textContent).toEqual('Total Number of Datasets: 2');
  expect(numFilesText.textContent).toEqual('Total Number of Files: 3');
});

it('shows the correct number of datasets and files when cart is empty', async () => {
  customRender(<Summary userCart={[]} />);
  const numDatasetsField = await screen.findByText('Total Number of Datasets:');
  const numFilesText = await screen.findByText('Total Number of Files:');

  expect(numDatasetsField.textContent).toEqual('Total Number of Datasets: 0');
  expect(numFilesText.textContent).toEqual('Total Number of Files: 0');
});

describe('shows the correct selected datasets and files', () => {
  it('when no items are selected', async () => {
    customRender(<Summary {...defaultProps} />);
    const numSelectedDatasetsField = await screen.findByText('Selected Number of Datasets:');
    const numSelectedFilesText = await screen.findByText('Selected Number of Files:');

    expect(numSelectedDatasetsField.textContent).toEqual('Selected Number of Datasets: 0');
    expect(numSelectedFilesText.textContent).toEqual('Selected Number of Files: 0');
  });

  it('when items are selected', async () => {
    AtomWrapper.modifyAtomValue(CartStateKeys.cartItemSelections, [
      rawSearchResultFixture(),
      rawSearchResultFixture(),
      rawSearchResultFixture(),
    ]);
    customRender(<Summary {...defaultProps} />);
    const numSelectedDatasetsField = await screen.findByText('Selected Number of Datasets:');
    const numSelectedFilesText = await screen.findByText('Selected Number of Files:');

    expect(numSelectedDatasetsField.textContent).toEqual('Selected Number of Datasets: 3');
    expect(numSelectedFilesText.textContent).toEqual('Selected Number of Files: 9');
  });
});

it('renders task submit history when tasks are present', async () => {
  const taskItems = [
    {
      taskId: '1',
      submitDate: '2023-01-01',
      taskStatusURL: 'http://example.com/task/1',
    },
  ];
  AtomWrapper.modifyAtomValue(GlobusStateKeys.globusTaskItems, taskItems);
  customRender(<Summary {...defaultProps} />);

  const taskHistoryTitle = await screen.findByText('Task Submit History');
  expect(taskHistoryTitle).toBeTruthy();
});

it('clears all tasks when clear button is clicked', async () => {
  const taskItems = [
    {
      taskId: '1',
      submitDate: '2023-01-01',
      taskStatusURL: 'http://example.com/task/1',
    },
  ];
  AtomWrapper.modifyAtomValue(GlobusStateKeys.globusTaskItems, taskItems);
  const { getByTestId } = customRender(<Summary {...defaultProps} />);

  const clearButton = getByTestId('clear-all-submitted-globus-tasks');
  await userEvent.click(clearButton);

  expect(screen.queryByText('Task Submit History')).toBeNull();
});
