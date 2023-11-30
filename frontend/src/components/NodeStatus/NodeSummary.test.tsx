import { within } from '@testing-library/react';
import React from 'react';
import { parsedNodeStatusFixture } from '../../api/mock/fixtures';
import NodeSummary, { Props } from './NodeSummary';
import { customRenderKeycloak } from '../../test/custom-render';

const defaultProps: Props = {
  nodeStatus: parsedNodeStatusFixture(),
};

it('renders component with node status information', () => {
  const { getByTestId } = customRenderKeycloak(<NodeSummary {...defaultProps} />);

  const numNodes = getByTestId('numNodes');
  expect(within(numNodes).getByText('2')).toBeTruthy();

  const numOnline = getByTestId('numOnline');
  expect(within(numOnline).getByText('1')).toBeTruthy();

  const numOffline = getByTestId('numOffline');
  expect(within(numOffline).getByText('1')).toBeTruthy();
});

it('renders component placeholder with no node status information', () => {
  const { getByTestId } = customRenderKeycloak(<NodeSummary />);

  const numNodes = getByTestId('numNodes');
  expect(within(numNodes).getByText('N/A')).toBeTruthy();

  const numOnline = getByTestId('numOnline');
  expect(within(numOnline).getByText('N/A')).toBeTruthy();

  const numOffline = getByTestId('numOffline');
  expect(within(numOffline).getByText('N/A')).toBeTruthy();
});
