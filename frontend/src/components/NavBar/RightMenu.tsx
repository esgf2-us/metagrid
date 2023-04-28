import {
  BarsOutlined,
  FileSearchOutlined,
  MailOutlined,
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
import RightDrawer from '../Messaging/RightDrawer';

const menuItemStyling: CSSProperties = { margin: '8px' };

export type Props = {
  mode: 'horizontal' | 'vertical' | 'inline';
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
  const [noticesVisible, setShowNotices] = React.useState(false);
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

  const showNotices = (): void => {
    setShowNotices(true);
  };

  const hideNotices = (): void => {
    setShowNotices(false);
  };

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
    <div data-testid="right-menu" className={navBarTargets.topNavBar.class()}>
      <Menu
        selectedKeys={[activeMenuItem]}
        mode={mode}
        style={
          mode === 'inline'
            ? { textAlign: 'left', justifyContent: 'flex-end' }
            : { textAlign: 'right', justifyContent: 'flex-end' }
        }
        overflowedIndicator={
          <BarsOutlined style={{ fontSize: '24px', margin: '20px 0' }} />
        }
      >
        <Menu.Item
          key="search"
          style={menuItemStyling}
          className={navBarTargets.searchPageBtn.class()}
        >
          <Link to="/search">
            <SearchOutlined /> Search
          </Link>
        </Menu.Item>
        <Menu.Item
          key="cartItems"
          style={menuItemStyling}
          className={`modified-item ${navBarTargets.cartPageBtn.class()}`}
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
          className={`modified-item ${navBarTargets.savedSearchPageBtn.class()}`}
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
          className={navBarTargets.nodeStatusBtn.class()}
        >
          <Link to="/nodes">
            <NodeIndexOutlined /> Node Status
          </Link>
        </Menu.Item>
        <Menu.Item style={menuItemStyling} key="news">
          <Button
            type="text"
            icon={<MailOutlined style={{ fontSize: '20px', margin: 0 }} />}
            onClick={showNotices}
          >
            News
          </Button>
        </Menu.Item>
        {!authenticated ? (
          <Menu.Item
            key="signIn"
            style={menuItemStyling}
            className={navBarTargets.signInBtn.class()}
          >
            <Button
              type="text"
              icon={<UserOutlined style={{ fontSize: '18px', margin: 0 }} />}
              onClick={() => {
                keycloak.login();
              }}
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
              <Button
                type="text"
                onClick={() => {
                  keycloak.logout();
                }}
              >
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
      <RightDrawer visible={noticesVisible} onClose={hideNotices} />
    </div>
  );
};

export default RightMenu;
