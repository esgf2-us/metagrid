import { act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import NodeStatus, { Props } from '.';
import { ResponseError } from '../../api';
import { parsedNodeStatusFixture } from '../../api/mock/fixtures';
import apiRoutes from '../../api/routes';
import customRender from '../../test/custom-render';

const user = userEvent.setup();

const defaultProps: Props = {
  nodeStatus: parsedNodeStatusFixture(),
  apiError: undefined,
  isLoading: false,
};

it('renders the loading table', () => {
  const { getByRole } = customRender(<NodeStatus isLoading></NodeStatus>);

  const header = getByRole('heading', {
    name: 'Fetching latest node status...',
  });
  expect(header).toBeTruthy();
});

it('renders the node status and columns sort', async () => {
  const { getByRole } = customRender(
    <NodeStatus {...defaultProps}></NodeStatus>
  );

  const header = getByRole('heading', {
    name: 'Status as of Wed, 21 Oct 2020 21:23:50 GMT',
  });
  expect(header).toBeTruthy();

  const nodeColHeader = getByRole('columnheader', { name: 'Node' });

  expect(nodeColHeader).toBeTruthy();

  await act(async () => {
    await user.click(nodeColHeader);
  });

  const isOnlineColHeader = getByRole('columnheader', {
    name: 'Online',
  });
  expect(isOnlineColHeader).toBeTruthy();

  await act(async () => {
    await user.click(isOnlineColHeader);
  });
});

it('renders an error message when no node status information is available', async () => {
  const { getByRole } = customRender(<NodeStatus isLoading={false} />);

  const alertMsg = await waitFor(() => getByRole('alert'));
  expect(alertMsg).toBeTruthy();
});

it('renders an error message when there is an api error', async () => {
  const errorMsg = 'Node status information is currently unavailable.';

  const { getByRole, getByText } = customRender(
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

  const { getByRole, getByText } = customRender(
    <NodeStatus isLoading={false} nodeStatus={[]}></NodeStatus>
  );

  const alertMsg = await waitFor(() => getByRole('alert'));
  expect(alertMsg).toBeTruthy();

  const errorMsgDiv = getByText(errorMsg);
  expect(errorMsgDiv).toBeTruthy();
});

it('renders fallback network error msg', async () => {
  const errorMsg = apiRoutes.nodeStatus.handleErrorMsg('generic');

  const { getByRole, getByText } = customRender(
    <NodeStatus isLoading={false}></NodeStatus>
  );

  const alertMsg = await waitFor(() => getByRole('alert'));
  expect(alertMsg).toBeTruthy();

  const errorMsgDiv = getByText(errorMsg);
  expect(errorMsgDiv).toBeTruthy();
});
