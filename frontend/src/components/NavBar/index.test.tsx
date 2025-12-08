import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rest, server } from '../../test/mock/server';
import apiRoutes from '../../api/routes';
import customRender from '../../test/custom-render';
import NavBar, { Props } from './index';
import { printElementContents } from '../../test/jestTestFunctions';

const user = userEvent.setup();

const defaultProps: Props = {
  onTextSearch: jest.fn(),
};

it('renders LeftMenu and RightMenu components', async () => {
  customRender(<NavBar {...defaultProps} />);

  const rightMenuComponent = await screen.findByTestId('right-menu');
  expect(rightMenuComponent).toBeTruthy();

  const leftMenuComponent = await screen.findByTestId('nav-bar-logo');
  expect(leftMenuComponent).toBeTruthy();
});

it('opens the drawer onClick and closes with onClose', async () => {
  customRender(<NavBar {...defaultProps} />);
  const leftMenu = await screen.findByTestId('nav-bar-logo');
  expect(leftMenu).toBeTruthy();
  expect(await screen.findByTestId('right-menu')).toBeTruthy();

  // Open drawer
  const drawerBtn = await screen.findByRole('img', { name: 'menu-unfold' });
  expect(drawerBtn).toBeTruthy();

  await user.click(drawerBtn);

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
    await user.click(drawerMask);
  }
});
