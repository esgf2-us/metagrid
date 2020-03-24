import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { Row, Col } from "antd";

import esgf_logo from "../../assets/img/esgf_logo.png";
import LeftMenu from "./LeftMenu";
import RightMenu from "./RightMenu";

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
    <nav style={styles.menuBar}>
      <Row align="middle">
        <Col span={3}>
          <img
            style={{ maxWidth: "100%", height: "auto" }}
            src={esgf_logo}
            alt="ESGF Logo"
          />
        </Col>
        <Col span={15}>
          <LeftMenu
            projects={projects}
            text={text}
            onFinish={onFinish}
            handleChange={handleChange}
          ></LeftMenu>
        </Col>
        <Col span={6}>
          <RightMenu></RightMenu>
        </Col>
      </Row>
    </nav>
  );
}

const styles = {
  menuBar: {}
};

export default NavBar;
