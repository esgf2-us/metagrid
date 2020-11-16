import {
  FileSearchOutlined,
  NodeIndexOutlined,
  SearchOutlined,
  ShoppingCartOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useKeycloak } from '@react-keycloak/web';
import { Badge, Menu } from 'antd';
import { KeycloakTokenParsed } from 'keycloak-js';
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import ToolTip from '../DataDisplay/ToolTip';
import Button from '../General/Button';

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
    } else if (location.pathname.includes('nodes')) {
      setActiveMenuItem('nodes');
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
          <Link to="/search">
            <SearchOutlined /> Search
          </Link>
        </Menu.Item>
        <Menu.Item key="nodes">
          <Link to="/nodes">
            <NodeIndexOutlined /> Node Status
          </Link>
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
        {!authenticated ? (
          <Menu.Item key="signIn">
            <Button
              type="text"
              icon={<UserOutlined style={{ fontSize: '18px' }} />}
              // TODO: Re-enable after Keycloak integration
              // onClick={() => keycloak.login()}
              disabled
            >
              Sign In
            </Button>
          </Menu.Item>
        ) : (
          <Menu.SubMenu
            icon={<UserOutlined style={{ fontSize: '18px' }} />}
            title={
              <span className="submenu-title-wrapper">
                Hi,{' '}
                {userInfo && userInfo.given_name
                  ? userInfo.given_name
                  : userInfo?.email}
              </span>
            }
          >
            <Menu.ItemGroup>
              <Menu.Item key="login">
                <Button type="text" onClick={() => keycloak.logout()}>
                  Sign Out
                </Button>
              </Menu.Item>
            </Menu.ItemGroup>
          </Menu.SubMenu>
        )}

        <Menu.Item key="cartItems" className="modified-item">
          <ToolTip title="Cart">
            <Badge
              count={numCartItems}
              className="badge"
              offset={[5, 3]}
              showZero
            >
              <Link to="/cart/items">
                <ShoppingCartOutlined style={{ fontSize: '20px' }} />
              </Link>
            </Badge>
          </ToolTip>
        </Menu.Item>
        <Menu.Item key="cartSearches" className="modified-item">
          <ToolTip title="Search Library">
            <Badge
              count={numSavedSearches}
              className="badge"
              offset={[5, 3]}
              showZero
            >
              <Link to="/cart/searches">
                <FileSearchOutlined style={{ fontSize: '20px' }} />
              </Link>
            </Badge>
          </ToolTip>
        </Menu.Item>
      </Menu>
    </div>
  );
};

export default RightMenu;
