import { fireEvent, render, waitFor } from '@testing-library/react';
import React from 'react';
import NodeStatus, { Props } from '.';
import { parsedNodeStatusFixture } from '../../api/mock/fixtures';

const defaultProps: Props = {
  nodeStatus: parsedNodeStatusFixture(),
  isLoading: false,
};

it('renders the loading table', () => {
  const { getByRole } = render(<NodeStatus isLoading></NodeStatus>);

  const header = getByRole('heading', {
    name: 'Fetching latest node status...',
  });
  expect(header).toBeTruthy();
});

it('renders the node status and columns sort', () => {
  const { getByRole, queryAllByRole } = render(
    <NodeStatus {...defaultProps}></NodeStatus>
  );

  const header = getByRole('heading', {
    name: 'Status as of Wed, 21 Oct 2020 21:23:50 GMT',
  });
  expect(header).toBeTruthy();

  const nodeColHeader = getByRole('columnheader', { name: 'Node caret-down' });

  expect(nodeColHeader).toBeTruthy();
  fireEvent.click(nodeColHeader);

  // TODO: Test order of rows

  const isOnlineColHeader = getByRole('columnheader', {
    name: 'Online caret-up caret-down',
  });
  expect(isOnlineColHeader).toBeTruthy();
  fireEvent.click(isOnlineColHeader);

  // TODO: Test order of rows
});

it('renders an error message when no node status information is available', async () => {
  const { getByRole } = render(<NodeStatus isLoading={false} />);

  const alertMsg = await waitFor(() =>
    getByRole('img', { name: 'close-circle', hidden: true })
  );
  expect(alertMsg).toBeTruthy();
});
