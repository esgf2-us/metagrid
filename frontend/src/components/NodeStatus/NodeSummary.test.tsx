import { within, screen } from '@testing-library/react';
import React from 'react';
import { parsedNodeStatusFixture } from '../../test/mock/fixtures';
import NodeSummary, { Props } from './NodeSummary';
import customRender from '../../test/custom-render';
import { isDarkModeAtom } from '../App/recoil/atoms';
import { RecoilWrapper } from '../../test/jestTestFunctions';

const defaultProps: Props = {
  nodeStatus: parsedNodeStatusFixture(),
};

it('renders component with node status information', async () => {
  customRender(<NodeSummary {...defaultProps} />);

  const numNodes = await screen.findByTestId('numNodes');
  expect(within(numNodes).getByText('2')).toBeTruthy();

  const numOnline = await screen.findByTestId('numOnline');
  expect(within(numOnline).getByText('1')).toBeTruthy();

  const numOffline = await screen.findByTestId('numOffline');
  expect(within(numOffline).getByText('1')).toBeTruthy();
});

it('renders component placeholder with no node status information', async () => {
  customRender(<NodeSummary />);

  const numNodes = await screen.findByTestId('numNodes');
  expect(await within(numNodes).findByText('N/A')).toBeTruthy();

  const numOnline = await screen.findByTestId('numOnline');
  expect(await within(numOnline).findByText('N/A')).toBeTruthy();

  const numOffline = await screen.findByTestId('numOffline');
  expect(await within(numOffline).findByText('N/A')).toBeTruthy();
});

it('renders component with dark mode enabled', async () => {
  // saveToLocalStorage(isDarkModeAtom.key, true);
  const recoil = new RecoilWrapper();
  recoil.addSetting(isDarkModeAtom, true);
  customRender(recoil.wrap(<NodeSummary {...defaultProps} />));

  const numNodes = await screen.findByTestId('numNodes');
  expect(within(numNodes).getByText('2')).toBeTruthy();

  const numOnline = await screen.findByTestId('numOnline');
  expect(within(numOnline).getByText('1')).toBeTruthy();

  const numOffline = await screen.findByTestId('numOffline');
  expect(within(numOffline).getByText('1')).toBeTruthy();
});
