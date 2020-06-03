import React from 'react';
import { Link } from 'react-router-dom';
import { Menu } from 'antd';
import { ShoppingCartOutlined, BookOutlined } from '@ant-design/icons';

import Button from '../General/Button';
import ToolTip from '../DataDisplay/ToolTip';

export type Props = {
  mode:
    | 'horizontal'
    | 'vertical'
    | 'vertical-left'
    | 'vertical-right'
    | 'inline';
  numCartItems: number;
  numSavedSearches: number;
};

const RightMenu: React.FC<Props> = ({
  mode,
  numCartItems,
  numSavedSearches,
}) => {
  return (
    <div data-testid="right-menu">
      <Menu defaultSelectedKeys={['search']} mode={mode}>
        <Menu.Item key="search">
          <Link to="/search">Search</Link>
        </Menu.Item>
        <Menu.SubMenu
          title={<span className="submenu-title-wrapper">Resources</span>}
          disabled
        >
          <Menu.ItemGroup title="Documentation">
            <Menu.Item key="guide">Guide</Menu.Item>
            <Menu.Item key="api">API</Menu.Item>
          </Menu.ItemGroup>
        </Menu.SubMenu>
        <Menu.Item key="login">
          <Button type="primary" disabled>
            Log In
          </Button>
        </Menu.Item>
        <Menu.Item>
          <ToolTip title="Your cart of items">
            <Link to="/cart">
              <Button type="link">
                <ShoppingCartOutlined style={{ fontSize: '24px' }} />
                {numCartItems}
              </Button>
            </Link>
          </ToolTip>
        </Menu.Item>
        <Menu.Item>
          <ToolTip title="Your library of saved searches">
            <Link to="/cart/searches">
              <Button type="link">
                <BookOutlined style={{ fontSize: '24px' }} />
                {numSavedSearches}
              </Button>
            </Link>
          </ToolTip>
        </Menu.Item>
      </Menu>
    </div>
  );
};

export default RightMenu;
