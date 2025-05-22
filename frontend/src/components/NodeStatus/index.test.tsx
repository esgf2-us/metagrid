import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import NodeStatus, { Props } from '.';
import { ResponseError } from '../../api';
import apiRoutes from '../../api/routes';
import customRender from '../../test/custom-render';
import { AtomWrapper } from '../../test/jestTestFunctions';
import { AppStateKeys } from '../../common/atoms';

const user = userEvent.setup();

const defaultProps: Props = {
  apiError: undefined,
  isLoading: false,
};

it('renders the loading table', async () => {
  customRender(<NodeStatus isLoading></NodeStatus>);

  const header = await screen.findByRole('heading', {
    name: 'Fetching latest node status...',
  });
  expect(header).toBeTruthy();
});

it('renders the node status and columns sort', async () => {
  customRender(<NodeStatus {...defaultProps}></NodeStatus>);

  const header = await screen.findByRole('heading', {
    name: 'Status as of Wed, 21 Oct 2020 21:23:50 GMT',
  });
  expect(header).toBeTruthy();

  const nodeColHeader = await screen.findByRole('columnheader', {
    name: 'Node',
  });

  expect(nodeColHeader).toBeTruthy();

  await user.click(nodeColHeader);

  const isOnlineColHeader = await screen.findByRole('columnheader', {
    name: 'Online',
  });
  expect(isOnlineColHeader).toBeTruthy();

  await user.click(isOnlineColHeader);
});

it('renders the node status in dark mode', async () => {
  AtomWrapper.modifyAtomValue(AppStateKeys.isDarkMode, true);
  customRender(<NodeStatus {...defaultProps}></NodeStatus>);

  const header = await screen.findByRole('heading', {
    name: 'Status as of Wed, 21 Oct 2020 21:23:50 GMT',
  });
  expect(header).toBeTruthy();

  const onlineStatus = await within((await screen.findAllByRole('row'))[1]).findByText('yes', {
    exact: false,
  });
  expect(onlineStatus).toHaveStyle({ color: 'darkModeGreen' }); // Expect dark green color value

  const offlineStatus = await within((await screen.findAllByRole('row'))[2]).findByText('no', {
    exact: false,
  });
  expect(offlineStatus).toHaveStyle({ color: 'darkModeRed' }); // Expect dark red color value
});

it('renders an error message when no node status information is available', async () => {
  AtomWrapper.modifyAtomValue(AppStateKeys.nodeStatus, []);
  customRender(<NodeStatus isLoading={false} />);

  const alertMsg = await screen.findByRole('alert');
  expect(alertMsg).toBeTruthy();
});

it('renders an error message when there is an api error', async () => {
  const errorMsg = 'Node status information is currently unavailable.';

  AtomWrapper.modifyAtomValue(AppStateKeys.nodeStatus, []);
  customRender(
    <NodeStatus isLoading={false} apiError={Error(errorMsg) as ResponseError}></NodeStatus>,
    { usesAtoms: true }
  );

  const alertMsg = await screen.findByRole('alert');
  expect(alertMsg).toBeTruthy();

  const errorMsgDiv = await screen.findByText(errorMsg);
  expect(errorMsgDiv).toBeTruthy();
});

it('renders error message that feature is disabled', async () => {
  const errorMsg =
    'This feature is not enabled on this node or status information is currently unavailable.';

  AtomWrapper.modifyAtomValue(AppStateKeys.nodeStatus, []);
  customRender(<NodeStatus isLoading={false} />, {
    usesAtoms: true,
  });

  const alertMsg = await screen.findByRole('alert');
  expect(alertMsg).toBeTruthy();

  const errorMsgDiv = await screen.findByText(errorMsg);
  expect(errorMsgDiv).toBeTruthy();
});

it('renders fallback network error msg', async () => {
  const errorMsg = apiRoutes.nodeStatus.handleErrorMsg('generic');

  AtomWrapper.modifyAtomValue(AppStateKeys.nodeStatus, (undefined as unknown) as []);
  customRender(<NodeStatus isLoading={false} />);

  const alertMsg = await screen.findByRole('alert');
  expect(alertMsg).toBeTruthy();

  const errorMsgDiv = await screen.findByText(errorMsg);
  expect(errorMsgDiv).toBeTruthy();
});
