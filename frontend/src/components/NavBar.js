import React, { Component } from "react";
import { Form, Input, Row, Col, Select } from "antd";

import esgf_logo from "../assets/img/esgf_logo.png";

const { Search } = Input;
const { Option } = Select;

const projects = ["CMIP6", "CMIP5", "E3SM", "CMIP3", "input4MIPs", "obs4MIPs"];

export class NavBar extends Component {
  state = {
    text: null,
    project: projects[0]
  };

  handleChange = e => {
    this.setState({ text: e.target.value });
  };

  handleSearch = value => {
    this.props.onSearch(value);
    this.setState({ text: null });
  };

  render() {
    return (
      <div>
        <Row align="middle">
          <Col span={6}>
            <img src={esgf_logo} />
          </Col>
          <Col span={12}>
            <Form layout="inline">
              <Form.Item>
                <Select
                  defaultValue={this.state.project}
                  style={{ width: 120 }}
                  onChange={this.props.onProjectChange}
                >
                  {projects.map(project => (
                    <Option key={project} value={project}>
                      {project}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item>
                <Search
                  placeholder="Search..."
                  onChange={this.handleChange}
                  onSearch={e => this.handleSearch(e)}
                  value={this.state.text}
                  enterButton
                  allowClear
                />
              </Form.Item>
            </Form>
          </Col>
          <Col span={6}></Col>
        </Row>
      </div>
    );
  }
}

export default NavBar;
