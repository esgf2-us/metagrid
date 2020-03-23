import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { Button, Form, Input, Row, Col, Select, Menu } from "antd";
import { SearchOutlined, ShoppingCartOutlined } from "@ant-design/icons";

import esgf_logo from "../assets/img/esgf_logo.png";

const { SubMenu } = Menu;
const { Option } = Select;

function NavBar({ onSearch, onProjectChange }) {
  NavBar.propTypes = {
    onSearch: PropTypes.func,
    onProjectChange: PropTypes.func
  };

  const [text, setText] = useState(null);
  const [projects, setProjects] = useState([]);

  const fetchProjects = async () => {
    // TODO: Fetch projects using an API
    const res = [
      "CMIP6",
      "CMIP5",
      "E3SM",
      "CMIP3",
      "input4MIPs",
      "obs4MIPs",
      "All (excl. CMIP6)"
    ];
    setProjects(res);
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleChange = e => {
    setText(e.target.value);
  };

  const onFinish = values => {
    onSearch(values.text);
    onProjectChange(values.project);
    setText(null);
  };

  return (
    <nav style={menuBar}>
      <Row align="middle">
        <Col span={3}>
          <img
            style={{ maxWidth: "100%", height: "auto" }}
            src={esgf_logo}
            alt="ESGF Logo"
          />
        </Col>
        <Col span={15}>
          <Form onFinish={onFinish}>
            <Input.Group compact>
              <Form.Item
                name="project"
                rules={[{ required: true, message: "Project is required" }]}
                style={{ width: "15%" }}
              >
                <Select placeholder="Project">
                  {projects.map(project => (
                    <Option key={project} value={project}>
                      {project}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item
                name="text"
                wrapperCol={{ sm: 24 }}
                rules={[{ required: true, message: "Text is required" }]}
                style={{ width: "75%" }}
              >
                <Input
                  onChange={handleChange}
                  value={text}
                  placeholder="Search..."
                />
              </Form.Item>
              <Button type="primary" htmlType="submit">
                <SearchOutlined />
              </Button>
            </Input.Group>
          </Form>
        </Col>
        <Col span={6}>
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
