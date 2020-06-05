import React from 'react';
import { Link, useLocation } from 'react-router-dom';
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
  const location = useLocation();
  const [activeMenuItem, setActiveMenuItem] = React.useState<string>('search');

  /**
   * Update the active menu item based on the current pathname
   */
  React.useEffect(() => {
    if (location.pathname.endsWith('search')) {
      setActiveMenuItem('search');
    } else if (location.pathname.includes('cart/items')) {
      setActiveMenuItem('cartItems');
    } else if (location.pathname.includes('cart/searches')) {
      setActiveMenuItem('cartSearches');
    }
  }, [location.pathname]);

  return (
    <div data-testid="right-menu">
      <Menu selectedKeys={[activeMenuItem]} mode={mode}>
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
        <Menu.Item key="cartItems">
          <ToolTip title="Your cart of items">
            <Link to="/cart/items">
              <Button type="link">
                <ShoppingCartOutlined style={{ fontSize: '24px' }} />
                {numCartItems}
              </Button>
            </Link>
          </ToolTip>
        </Menu.Item>
        <Menu.Item key="cartSearches">
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
