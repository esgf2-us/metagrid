import React from 'react';
import PropTypes from 'prop-types';
import { Button, Menu } from 'antd';
import { ShoppingCartOutlined } from '@ant-design/icons';

const { SubMenu } = Menu;

function RightMenu({ mode, cartItems }) {
  RightMenu.propTypes = {
    mode: PropTypes.string.isRequired,
    cartItems: PropTypes.number.isRequired,
  };

  return (
    <div data-testid="right-menu">
      <Menu mode={mode}>
        <SubMenu title={<span className="submenu-title-wrapper">Learn</span>}>
          <Menu.ItemGroup title="Documentation">
            <Menu.Item key="guide">Guide</Menu.Item>
            <Menu.Item key="api">API</Menu.Item>
          </Menu.ItemGroup>
        </SubMenu>
        <Menu.Item key="about" disabled>
          About
        </Menu.Item>
        <Menu.Item key="resources" disabled>
          Resources
        </Menu.Item>
        <Menu.Item key="login">
          <Button type="link" style={{ fontStyle: 'bold' }}>
            Log In
          </Button>
        </Menu.Item>
        <Menu.Item>
          <Button type="link">
            <ShoppingCartOutlined style={{ fontSize: '24px' }} />
            {cartItems}
          </Button>
        </Menu.Item>
      </Menu>
    </div>
  );
}

export default RightMenu;
