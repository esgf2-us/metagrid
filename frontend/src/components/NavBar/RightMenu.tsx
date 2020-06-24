import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu } from 'antd';
import { KeycloakTokenParsed } from 'keycloak-js';
import {
  ShoppingCartOutlined,
  SearchOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useKeycloak } from '@react-keycloak/web';

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
  const [activeMenuItem, setActiveMenuItem] = React.useState<string>('search');

  const location = useLocation();
  const [keycloak] = useKeycloak();

  let userInfo;
  const { authenticated } = keycloak;
  if (authenticated) {
    userInfo = keycloak.idTokenParsed as KeycloakTokenParsed & {
      given_name: string;
      email: string;
    };
  }

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
        <Menu.SubMenu
          icon={<UserOutlined style={{ fontSize: '24px' }} />}
          title={
            <span className="submenu-title-wrapper">
              {userInfo ? `Hi, ${userInfo.given_name}` : 'Sign In'}
            </span>
          }
        >
          <Menu.ItemGroup>
            <Menu.Item key="login">
              {!authenticated ? (
                <Button type="text" onClick={() => keycloak.login()}>
                  Sign In
                </Button>
              ) : (
                <Button type="text" onClick={() => keycloak.logout()}>
                  Sign Out
                </Button>
              )}
            </Menu.Item>
          </Menu.ItemGroup>
        </Menu.SubMenu>
        <Menu.Item key="cartItems" className="modified-item">
          <ToolTip title="Cart">
            <Link to="/cart/items">
              <ShoppingCartOutlined style={{ fontSize: '24px' }} />
              {numCartItems}
            </Link>
          </ToolTip>
        </Menu.Item>
        <Menu.Item key="cartSearches" className="modified-item">
          <ToolTip title="Saved Searches">
            <Link to="/cart/searches">
              <SearchOutlined style={{ fontSize: '24px' }} />
              {numSavedSearches}
            </Link>
          </ToolTip>
        </Menu.Item>
      </Menu>
    </div>
  );
};

export default RightMenu;
