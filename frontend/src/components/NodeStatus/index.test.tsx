import { fireEvent, render, waitFor } from '@testing-library/react';
import React from 'react';
import NodeStatus, { Props } from '.';
import { ResponseError } from '../../api';
import { parsedNodeStatusFixture } from '../../api/mock/fixtures';
import apiRoutes from '../../api/routes';

const defaultProps: Props = {
  nodeStatus: parsedNodeStatusFixture(),
  apiError: undefined,
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
  const { getByRole } = render(<NodeStatus {...defaultProps}></NodeStatus>);

  const header = getByRole('heading', {
    name: 'Status as of Wed, 21 Oct 2020 21:23:50 GMT',
  });
  expect(header).toBeTruthy();

  const nodeColHeader = getByRole('columnheader', { name: 'Node caret-down' });

  expect(nodeColHeader).toBeTruthy();
  fireEvent.click(nodeColHeader);

  const isOnlineColHeader = getByRole('columnheader', {
    name: 'Online caret-up caret-down',
  });
  expect(isOnlineColHeader).toBeTruthy();
  fireEvent.click(isOnlineColHeader);
});

it('renders an error message when no node status information is available', async () => {
  const { getByRole } = render(<NodeStatus isLoading={false} />);

  const alertMsg = await waitFor(() => getByRole('alert'));
  expect(alertMsg).toBeTruthy();
});

it('renders an error message when there is an api error', async () => {
  const errorMsg = 'API error';

  const { getByRole, getByText } = render(
    <NodeStatus
      isLoading={false}
      apiError={Error(errorMsg) as ResponseError}
    ></NodeStatus>
  );

  const alertMsg = await waitFor(() => getByRole('alert'));
  expect(alertMsg).toBeTruthy();

  const errorMsgDiv = getByText(errorMsg);
  expect(errorMsgDiv).toBeTruthy();
});

it('renders error message that feature is disabled', async () => {
  const errorMsg =
    'This feature is not enabled on this node or status information is currently unavailable.';

  const { getByRole, getByText } = render(
    <NodeStatus isLoading={false} nodeStatus={[]}></NodeStatus>
  );

  const alertMsg = await waitFor(() => getByRole('alert'));
  expect(alertMsg).toBeTruthy();

  const errorMsgDiv = getByText(errorMsg);
  expect(errorMsgDiv).toBeTruthy();
});

it('renders fallback network error msg', async () => {
  const errorMsg = apiRoutes.nodeStatus.handleErrorMsg('generic');

  const { getByRole, getByText } = render(
    <NodeStatus isLoading={false}></NodeStatus>
  );

  const alertMsg = await waitFor(() => getByRole('alert'));
  expect(alertMsg).toBeTruthy();

  const errorMsgDiv = getByText(errorMsg);
  expect(errorMsgDiv).toBeTruthy();
});
