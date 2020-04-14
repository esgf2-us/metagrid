import React from 'react';
import { useAsync } from 'react-async';
import PropTypes from 'prop-types';
import { Row, Col, Button, Drawer } from 'antd';
import { MenuUnfoldOutlined } from '@ant-design/icons';

import LeftMenu from './LeftMenu';
import RightMenu from './RightMenu';
import './NavBar.css';

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
  const [visible, setVisible] = React.useState(false);

  const showDrawer = () => {
    setVisible(true);
  };

  const onClose = () => {
    setVisible(false);
  };

  const onFinish = (values) => {
    onSearch(values.text);
    onProjectChange(values.project);
    setText('');
  };

  if (error) {
    return 'Error!';
  }

  return (
    <Row align="middle">
      <nav data-testid="nav-bar" className="navbar">
        <div className="navbar-logo">
          <Button type="link" href="#">
            <img
              style={{ maxWidth: '100%', height: 'auto' }}
              src={esgfLogo}
              alt="ESGF Logo"
            />
          </Button>
        </div>

        <div className="navbar-container">
          <div className="navbar-left">
            <LeftMenu
              mode="horizontal"
              projects={isPending ? [] : data.projects}
              text={text}
              onFinish={onFinish}
              handleChange={(e) => setText(e.target.value)}
            ></LeftMenu>
          </div>

          <div className="navbar-right">
            <RightMenu mode="horizontal" cartItems={cartItems}></RightMenu>
          </div>
          <Button
            className="navbar-mobile-button"
            type="primary"
            onClick={showDrawer}
          >
            <MenuUnfoldOutlined />
          </Button>
          <Drawer
            placement="right"
            className="navbar-drawer"
            closable={false}
            onClose={onClose}
            visible={visible}
          >
            <RightMenu mode="inline" cartItems={cartItems}></RightMenu>
          </Drawer>
        </div>
      </nav>
    </Row>
  );
}

export default NavBar;
