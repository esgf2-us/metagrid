import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Row, Col } from 'antd';

import LeftMenu from './LeftMenu';
import RightMenu from './RightMenu';

import esgf_logo from '../../assets/img/esgf_logo.png';
import dbJson from '../../mocks/db.json';

const styles = {
  menuBar: {},
};

/**
 * Fetch list of projects
 * TODO: Call an API instead of mock data
 */
const fetchProjects = async () => {
  return JSON.parse(JSON.stringify(dbJson.projects));
};

export function useProjects() {
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    fetchProjects()
      .then((res) => {
        setProjects(res);
      })
      .catch((e) => {
        console.warn('Error fetching data');
      });
  }, []);
  return projects;
}

function NavBar({ cartItems, onSearch, onProjectChange }) {
  NavBar.propTypes = {
    cartItems: PropTypes.number.isRequired,
    onSearch: PropTypes.func.isRequired,
    onProjectChange: PropTypes.func.isRequired,
  };

  const [text, setText] = useState(null);
  const projects = useProjects();

  const handleChange = (e) => {
    setText(e.target.value);
  };

  const onFinish = (values) => {
    onSearch(values.text);
    onProjectChange(values.project);
    setText(null);
  };
  return (
    <nav style={styles.menuBar}>
      <Row align="middle">
        <Col span={3}>
          <img
            style={{ maxWidth: '100%', height: 'auto' }}
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
          <RightMenu cartItems={cartItems}></RightMenu>
        </Col>
      </Row>
    </nav>
  );
}

export default NavBar;
