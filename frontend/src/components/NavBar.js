import React, { useState, useEffect } from "react";
import { Form, Input, Row, Col, Select } from "antd";
import esgf_logo from "../assets/img/esgf_logo.png";

const { Search } = Input;
const { Option } = Select;

function NavBar({ onSearch, onProjectChange }) {
  const [text, setText] = useState(null);
  const [projects, setProjects] = useState([]);

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
    <div>
      <Row align="middle">
        <Col span={6}>
          <img src={esgf_logo} alt="ESGF Logo" />
        </Col>
        <Col span={12}>
          <Form layout="inline">
            <Form.Item>
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
            </Form.Item>
            <Form.Item>
              <Search
                placeholder="Search..."
                onChange={handleChange}
                onSearch={e => handleSearch(e)}
                value={text}
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

export default NavBar;
