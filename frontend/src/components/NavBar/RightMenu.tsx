import {
  BarsOutlined,
  FileSearchOutlined,
  NodeIndexOutlined,
  QuestionCircleOutlined,
  SearchOutlined,
  ShoppingCartOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useKeycloak } from '@react-keycloak/web';
import { Badge, Menu } from 'antd';
import { KeycloakTokenParsed } from 'keycloak-js';
import React, { CSSProperties } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { navBarTargets } from '../../common/reactJoyrideSteps';
import Button from '../General/Button';

const menuItemStyling: CSSProperties = { margin: '8px' };

export type Props = {
  mode:
    | 'horizontal'
    | 'vertical'
    | 'vertical-left'
    | 'vertical-right'
    | 'inline';
  numCartItems: number;
  numSavedSearches: number;
  supportModalVisible: (visible: boolean) => void;
};

const RightMenu: React.FC<Props> = ({
  mode,
  numCartItems,
  numSavedSearches,
  supportModalVisible,
}) => {
  const [activeMenuItem, setActiveMenuItem] = React.useState<string>('search');

  const location = useLocation();
  const { keycloak } = useKeycloak();

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
    <div
      data-testid="right-menu"
      className={navBarTargets.getClass('topNavBar')}
    >
      <Menu
        selectedKeys={[activeMenuItem]}
        mode={mode}
        style={
          mode === 'inline' ? { textAlign: 'left' } : { textAlign: 'right' }
        }
        overflowedIndicator={<BarsOutlined style={{ fontSize: '24px' }} />}
      >
        <Menu.Item
          key="search"
          style={menuItemStyling}
          className={navBarTargets.getClass('searchPageBtn')}
        >
          <Link to="/search">
            <SearchOutlined /> Search
          </Link>
        </Menu.Item>
        <Menu.Item
          key="cartItems"
          style={menuItemStyling}
          className={`modified-item ${navBarTargets.getClass('cartPageBtn')}`}
        >
          <Link to="/cart/items">
            <ShoppingCartOutlined style={{ fontSize: '20px' }} />
            <Badge
              count={numCartItems}
              className="badge"
              offset={[-5, 3]}
              showZero
            ></Badge>
            Cart
          </Link>
        </Menu.Item>
        <Menu.Item
          key="cartSearches"
          style={menuItemStyling}
          className={`modified-item ${navBarTargets.getClass(
            'savedSearchPageBtn'
          )}`}
        >
          <Link to="/cart/searches">
            <FileSearchOutlined style={{ fontSize: '20px' }} />{' '}
            <Badge
              count={numSavedSearches}
              className="badge"
              offset={[-5, 3]}
              showZero
            ></Badge>
            Saved Searches
          </Link>
        </Menu.Item>
        <Menu.Item
          key="nodes"
          style={menuItemStyling}
          className={navBarTargets.getClass('nodeStatusBtn')}
        >
          <Link to="/nodes">
            <NodeIndexOutlined /> Node Status
          </Link>
        </Menu.Item>
        {!authenticated ? (
          <Menu.Item
            key="signIn"
            style={menuItemStyling}
            className={navBarTargets.getClass('signInBtn')}
          >
            <Button
              type="text"
              icon={<UserOutlined style={{ fontSize: '18px', margin: 0 }} />}
              onClick={() => keycloak.login()}
            >
              Sign In
            </Button>
          </Menu.Item>
        ) : (
          <Menu.SubMenu
            key="greeting"
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
            <Menu.Item key="login">
              <Button type="text" onClick={() => keycloak.logout()}>
                Sign Out
              </Button>
            </Menu.Item>
          </Menu.SubMenu>
        )}
        <Menu.Item style={menuItemStyling} key="help">
          <Button
            type="text"
            icon={
              <QuestionCircleOutlined style={{ fontSize: '18px', margin: 0 }} />
            }
            onClick={() => supportModalVisible(true)}
          >
            Help
          </Button>
        </Menu.Item>
      </Menu>
    </div>
  );
};

export default RightMenu;
