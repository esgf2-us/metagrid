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
import { Badge, Menu, MenuProps, Space, Switch } from 'antd';
import { KeycloakTokenParsed } from 'keycloak-js';

import React, { CSSProperties } from 'react';
import { Link, useLocation } from 'react-router';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { navBarTargets } from '../../common/joyrideTutorials/reactJoyrideSteps';
import Button from '../General/Button';
import RightDrawer from '../Messaging/RightDrawer';

import { AuthContext } from '../../contexts/AuthContext';
import { UserCart, UserSearchQueries } from '../Cart/types';
import {
  isDarkModeAtom,
  userCartAtom,
  userSearchQueriesAtom,
  supportModalVisibleAtom,
} from '../../common/atoms';

const menuItemStyling: CSSProperties = { margin: '8px' };

export type Props = {
  mode: 'horizontal' | 'vertical' | 'inline';
};

const RightMenu: React.FC<React.PropsWithChildren<Props>> = ({ mode }) => {
  // Global states
  const [isDarkMode, setIsDarkMode] = useAtom<boolean>(isDarkModeAtom);

  const userCart = useAtomValue<UserCart>(userCartAtom);

  const userSearchQueries = useAtomValue<UserSearchQueries>(userSearchQueriesAtom);

  const setSupportModalVisible = useSetAtom(supportModalVisibleAtom);

  const [activeMenuItem, setActiveMenuItem] = React.useState<string>('search');

  const [noticesOpen, setShowNotices] = React.useState(false);

  const location = useLocation();

  const authState = React.useContext(AuthContext);
  const { access_token: accessToken, pk } = authState;
  const authenticated = accessToken && pk;

  let loginBtn: JSX.Element;
  let logoutBtn: JSX.Element;
  let userInfo = { email: '', given_name: '' };

  if (window.METAGRID.AUTHENTICATION_METHOD === 'keycloak') {
    const { keycloak } = useKeycloak();
    loginBtn = (
      <Button
        type="text"
        icon={<UserOutlined style={{ fontSize: '18px', margin: 0 }} />}
        onClick={
          /* istanbul ignore next */ () => {
            keycloak.login();
          }
        }
      >
        Sign In
      </Button>
    );
    logoutBtn = (
      <Button
        type="text"
        onClick={
          /* istanbul ignore next */ () => {
            keycloak.logout();
          }
        }
      >
        Sign Out
      </Button>
    );
    if (authenticated) {
      userInfo = keycloak.idTokenParsed as KeycloakTokenParsed & {
        email: string;
        given_name: string;
      };
    }
  } else if (window.METAGRID.AUTHENTICATION_METHOD === 'globus') {
    loginBtn = (
      <Button
        type="text"
        icon={<UserOutlined style={{ fontSize: '18px', margin: 0 }} />}
        href="login/globus/"
      >
        Sign In
      </Button>
    );
    logoutBtn = (
      <Button type="text" href="proxy/globus-logout/">
        Sign Out
      </Button>
    );
    if (authenticated) {
      userInfo = {
        email: authState.email as string,
        given_name: '',
      };
    }
  }

  const showNotices = (): void => {
    setShowNotices(true);
  };

  const hideNotices = (): void => {
    setShowNotices(false);
  };

  type MenuItem = Required<MenuProps>['items'][number];

  function getSignInItem(): MenuItem {
    if (authenticated) {
      return {
        key: 'greeting',
        icon: <UserOutlined style={{ fontSize: '18px' }} />,
        className: navBarTargets.signInBtn.class(),
        label: (
          <span className="submenu-title-wrapper">
            Hi, {userInfo && userInfo.given_name ? userInfo.given_name : userInfo?.email}
          </span>
        ),
        children: [
          {
            key: 'login',
            label: logoutBtn,
          },
        ],
        style: menuItemStyling,
      };
    }
    return {
      key: 'signIn',
      label: loginBtn,
      className: navBarTargets.signInBtn.class(),
      style: menuItemStyling,
    };
  }

  const showStatus = window.METAGRID.STATUS_URL !== null;

  const menuItems: MenuItem[] = [
    {
      label: (
        <Link to="/search">
          <SearchOutlined /> Search
        </Link>
      ),
      key: 'search',
      style: menuItemStyling,
      className: navBarTargets.searchPageBtn.class(),
    },
    {
      label: (
        <Link data-testid="cartPageLink" to="/cart/items">
          <ShoppingCartOutlined style={{ fontSize: '20px' }} />
          <Badge count={userCart.length} className="badge" offset={[-5, 3]} showZero></Badge>
          Cart
        </Link>
      ),
      key: 'cartItems',
      style: menuItemStyling,
      className: `modified-item ${navBarTargets.cartPageBtn.class()}`,
    },
    {
      label: (
        <Link to="/cart/searches">
          <FileSearchOutlined style={{ fontSize: '20px' }} />{' '}
          <Badge
            count={userSearchQueries.length}
            className="badge"
            offset={[-5, 3]}
            showZero
          ></Badge>
          Saved Searches
        </Link>
      ),
      key: 'cartSearches',
      style: menuItemStyling,
      className: `modified-item ${navBarTargets.savedSearchPageBtn.class()}`,
    },
    ...(showStatus
      ? [
          {
            label: (
              <Link to="/nodes">
                <NodeIndexOutlined /> Node Status
              </Link>
            ),
            key: 'nodes',
            style: menuItemStyling,
            className: navBarTargets.nodeStatusBtn.class(),
          },
        ]
      : []),
    {
      label: (
        <Button
          type="text"
          icon={<MailOutlined style={{ fontSize: '20px', margin: 0 }} />}
          onClick={showNotices}
        >
          News
        </Button>
      ),
      key: 'news',
      style: menuItemStyling,
      className: navBarTargets.newsBtn.class(),
    },
    getSignInItem(),
    {
      label: (
        <Button
          type="text"
          icon={<QuestionCircleOutlined style={{ fontSize: '18px', margin: 0 }} />}
          onClick={() => setSupportModalVisible(true)}
        >
          Help
        </Button>
      ),
      key: 'help',
      style: menuItemStyling,
      className: navBarTargets.helpBtn.class(),
    },
    {
      label: (
        <Space>
          <Switch
            className={navBarTargets.themeSwitchBtn.class()}
            checkedChildren="Light"
            unCheckedChildren="Dark"
            onChange={(checked) => setIsDarkMode(!checked)}
            defaultChecked={!isDarkMode}
            data-testid="isDarkModeSwitch"
          />
          <span>Theme</span>
        </Space>
      ),
      key: 'display-mode',
      style: menuItemStyling,
    },
  ];

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
        overflowedIndicator={<BarsOutlined style={{ fontSize: '24px', margin: '20px 0' }} />}
        items={menuItems}
      />
      <RightDrawer open={noticesOpen} onClose={hideNotices} />
    </div>
  );
};

export default RightMenu;
