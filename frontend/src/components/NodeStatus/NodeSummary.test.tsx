import { within, screen } from '@testing-library/react';
import React from 'react';
import NodeSummary from './NodeSummary';
import customRender from '../../test/custom-render';
import { isDarkModeAtom, nodeStatusAtom } from '../App/recoil/atoms';
import {
  RecoilWrapper,
  saveToLocalStorage,
} from '../../test/jestTestFunctions';
import { darkModeGreen, darkModeRed } from './StatusToolTip';

it('renders component with node status information', async () => {
  customRender(<NodeSummary />);

  const numNodes = await screen.findByTestId('numNodes');
  expect(within(numNodes).getByText('2')).toBeTruthy();

  const numOnline = await screen.findByTestId('numOnline');
  expect(within(numOnline).getByText('1')).toBeTruthy();

  const numOffline = await screen.findByTestId('numOffline');
  expect(within(numOffline).getByText('1')).toBeTruthy();
});

it('renders component placeholder with no node status information', async () => {
  RecoilWrapper.modifyAtomValue(nodeStatusAtom.key, []);
  customRender(<NodeSummary />);

  const numNodes = await screen.findByTestId('numNodes');
  expect(await within(numNodes).findByText('N/A')).toBeTruthy();

  const numOnline = await screen.findByTestId('numOnline');
  expect(await within(numOnline).findByText('N/A')).toBeTruthy();

  const numOffline = await screen.findByTestId('numOffline');
  expect(await within(numOffline).findByText('N/A')).toBeTruthy();
});

it('renders component with dark mode enabled', async () => {
  RecoilWrapper.modifyAtomValue(isDarkModeAtom.key, true);
  saveToLocalStorage(isDarkModeAtom.key, true);
  customRender(<NodeSummary />);

  const numNodes = await screen.findByTestId('numNodes');
  expect(within(numNodes).getByText('2')).toBeTruthy();

  const numOnline = await screen.findByTestId('numOnline');
  expect(within(numOnline).getByText('1')).toBeTruthy();

  const numOffline = await screen.findByTestId('numOffline');
  expect(within(numOffline).getByText('1')).toBeTruthy();

  // Verify dark mode styling for close and check circles
  const closeCircle = await screen.findByRole('img', { name: 'close-circle' });
  expect(closeCircle.firstChild?.firstChild).toHaveAttribute('fill', darkModeRed);

  const checkCircle = await screen.findByRole('img', { name: 'check-circle' });
  expect(checkCircle.firstChild?.firstChild).toHaveAttribute('fill', darkModeGreen);
});
