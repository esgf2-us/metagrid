import React from 'react';
import { useAsync } from 'react-async';
import PropTypes from 'prop-types';
import { Row, Col } from 'antd';

import LeftMenu from './LeftMenu';
import RightMenu from './RightMenu';

import { fetchProjects } from '../../utils/api';
import esgfLogo from '../../assets/img/esgf_logo.png';

function NavBar({ cartItems, onSearch, onProjectChange }) {
  NavBar.propTypes = {
    cartItems: PropTypes.number.isRequired,
    onSearch: PropTypes.func.isRequired,
    onProjectChange: PropTypes.func.isRequired,
  };

  const { data, error, isPending } = useAsync({ promiseFn: fetchProjects });
  const [text, setText] = React.useState('');

  const onFinish = (values) => {
    onSearch(values.text);
    onProjectChange(values.project);
    setText('');
  };

  if (error) {
    return 'Error!';
  }

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
            projects={isPending ? [] : data.projects}
            text={text}
            onFinish={onFinish}
            handleChange={(e) => setText(e.target.value)}
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
