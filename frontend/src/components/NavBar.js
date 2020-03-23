import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { Button, Input, Row, Col, Select, Menu } from "antd";
import { ShoppingCartOutlined } from "@ant-design/icons";

import esgf_logo from "../assets/img/esgf_logo.png";

const { SubMenu } = Menu;
const { Search } = Input;
const { Option } = Select;

const menu = (
  <Menu>
    <Menu.Item key="0">Documentation</Menu.Item>
    <Menu.Divider />
    <Menu.Item key="1">
      <a
        target="_blank"
        rel="noopener noreferrer"
        href="http://www.alipay.com/"
      >
        Guide
      </a>
    </Menu.Item>
    <Menu.Item key="2">
      <a
        target="_blank"
        rel="noopener noreferrer"
        href="http://www.taobao.com/"
      >
        API
      </a>
    </Menu.Item>
  </Menu>
);

function NavBar({ onSearch, onProjectChange }) {
  NavBar.propTypes = {
    onSearch: PropTypes.func,
    onProjectChange: PropTypes.func
  };

  const [text, setText] = useState(null);
  const [projects, setProjects] = useState([]);

  const [current, setCurrent] = useState(null);
  const [visible, setVisible] = useState(false);

  const fetchProjects = async () => {
    // TODO: Fetch projects using an API
    const res = ["CMIP6", "CMIP5", "E3SM", "CMIP3", "input4MIPs", "obs4MIPs"];
    setProjects(res);
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleChange = e => {
    setText(e.target.value);
  };

  const handleSearch = value => {
    onSearch(value);
    setText(null);
  };

  return (
    <nav style={menuBar}>
      <Row align="middle">
        <Col span={2}>
          <img
            style={{ maxWidth: "100%", height: "auto" }}
            src={esgf_logo}
            alt="ESGF Logo"
          />
        </Col>
        <Col span={16}>
          <Input.Group compact>
            <Select
              placeholder="Project"
              style={{ width: 120 }}
              onChange={onProjectChange}
            >
              {projects.map(project => (
                <Option key={project} value={project}>
                  {project}
                </Option>
              ))}
            </Select>
            <Search
              placeholder="Search..."
              onChange={handleChange}
              onSearch={e => handleSearch(e)}
              value={text}
              enterButton
              allowClear
              required
              style={{ width: "80%" }}
            />
          </Input.Group>
        </Col>
        <Col>
          <Row>
            <Menu
              // onClick={this.handleClick}
              // selectedKeys={[this.state.current]}
              mode="horizontal"
              style={{ borderBottom: "none" }}
            >
              <SubMenu
                title={<span className="submenu-title-wrapper">Learn</span>}
              >
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
            </Button>
          </Row>
        </Col>
      </Row>
    </nav>
  );
}

const menuBar = {};

export default NavBar;
