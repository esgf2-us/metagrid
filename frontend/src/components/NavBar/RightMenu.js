import React from "react";
import PropTypes from "prop-types";
import { Button, Row, Menu } from "antd";
import { ShoppingCartOutlined } from "@ant-design/icons";

const { SubMenu } = Menu;

function RightMenu({ cartItems }) {
  RightMenu.propTypes = {
    cartItems: PropTypes.number.isRequired
  };

  return (
    <div>
      <Row>
        <Menu mode="horizontal" style={{ borderBottom: "none" }}>
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
        </Menu>
        <Button type="link" style={{ fontSize: "24px", fontStyle: "bold" }}>
          Log In
        </Button>
        <Button type="link">
          <ShoppingCartOutlined style={{ fontSize: "32px" }} />
          {cartItems}
        </Button>
      </Row>
    </div>
  );
}

export default RightMenu;
