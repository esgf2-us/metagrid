import React from 'react';
import PropTypes from 'prop-types';
import { Row, Col } from 'antd';

import LeftMenu from './LeftMenu';
import RightMenu from './RightMenu';

import esgfLogo from '../../assets/img/esgf_logo.png';

function NavBar({ projects, cartItems, onSearch, onProjectChange }) {
  NavBar.propTypes = {
    projects: PropTypes.arrayOf(PropTypes.string).isRequired,
    cartItems: PropTypes.number.isRequired,
    onSearch: PropTypes.func.isRequired,
    onProjectChange: PropTypes.func.isRequired,
  };

  const [text, setText] = React.useState(null);

  const handleChange = (e) => {
    setText(e.target.value);
  };

  const onFinish = (values) => {
    onSearch(values.text);
    onProjectChange(values.project);
    setText(null);
  };
  return (
    <nav data-testid="nav-bar">
      <Row align="middle">
        <Col span={3}>
          <img
            style={{ maxWidth: '100%', height: 'auto' }}
            src={esgfLogo}
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
