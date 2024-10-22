import React from 'react';
import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rest, server } from '../../test/mock/server';
import apiRoutes from '../../api/routes';
import customRender from '../../test/custom-render';
import NavBar, { Props } from './index';

const user = userEvent.setup();

const defaultProps: Props = {
  numCartItems: 0,
  numSavedSearches: 0,
  onTextSearch: jest.fn(),
  supportModalVisible: jest.fn(),
};

it('renders LeftMenu and RightMenu components', async () => {
  customRender(<NavBar {...defaultProps} />);

  const rightMenuComponent = await screen.findByTestId('right-menu');
  expect(rightMenuComponent).toBeTruthy();

  const leftMenuComponent = await screen.findByTestId('left-menu');
  expect(leftMenuComponent).toBeTruthy();
});

it('renders error message when projects can"t be fetched', async () => {
  server.use(
    rest.get(apiRoutes.projects.path, (_req, res, ctx) => res(ctx.status(404)))
  );
  customRender(<NavBar {...defaultProps} />);

  const alertComponent = await screen.findByRole('img', {
    name: 'close-circle',
  });
  expect(alertComponent).toBeTruthy();
});

it('opens the drawer onClick and closes with onClose', async () => {
  customRender(<NavBar {...defaultProps} />);
  const leftMenu = await screen.findByTestId('left-menu');
  expect(leftMenu).toBeTruthy();
  expect(await screen.findByTestId('right-menu')).toBeTruthy();

  // Open drawer
  const drawerBtn = await screen.findByRole('img', { name: 'menu-unfold' });
  expect(drawerBtn).toBeTruthy();

  await act(async () => {
    await user.click(drawerBtn);
  });

  // Close drawer by clicking on mask
  // It is not best practice to use querySelect to query elements. However, this
  // test case is an exception because the Ant Design Drawer API doesn't expose
  // a way to query for the drawer mask using role, text, etc. Also, we cannot
  // use the react-testing-library container method because the drawer renders
  // outside of the component dynamically, so document has to be used instead.
  // Source: https://testing-library.com/docs/guide-which-query#manual-queries
  const drawerMask = document.querySelector('div.ant-drawer-mask');
  expect(drawerMask).not.toBeNull();
  if (drawerMask !== null) {
    await act(async () => {
      await user.click(drawerMask);
    });
  }
});
