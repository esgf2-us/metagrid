import React from 'react';
import { useAsync } from 'react-async';
import PropTypes from 'prop-types';
import { Row, Drawer } from 'antd';
import { MenuUnfoldOutlined } from '@ant-design/icons';

import Alert from '../Feedback/Alert';
import Button from '../General/Button';
import LeftMenu from './LeftMenu';
import RightMenu from './RightMenu';
import './NavBar.css';

import { fetchProjects } from '../../utils/api';
import esgfLogo from '../../assets/img/esgf_logo.png';

function NavBar({ project, cartItems, onSearch, onProjectChange }) {
  NavBar.propTypes = {
    project: PropTypes.string.isRequired,
    cartItems: PropTypes.number.isRequired,
    onSearch: PropTypes.func.isRequired,
    onProjectChange: PropTypes.func.isRequired,
  };

  const { data, error, isPending } = useAsync({ promiseFn: fetchProjects });
  const [showDrawer, setShowDrawer] = React.useState(false);

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
            {error ? (
              <Alert
                message="There was an error fetching list of projects. Please contain support or try again later."
                type="error"
              />
            ) : (
              <LeftMenu
                project={project}
                projects={isPending ? [] : data.projects}
                onSearch={onSearch}
                onProjectChange={onProjectChange}
              ></LeftMenu>
            )}
          </div>

          <div className="navbar-right">
            <RightMenu mode="horizontal" cartItems={cartItems}></RightMenu>
          </div>
          <Button
            className="navbar-mobile-button"
            type="primary"
            onClick={() => setShowDrawer(true)}
          >
            <MenuUnfoldOutlined />
          </Button>
          <Drawer
            placement="right"
            className="navbar-drawer"
            closable={false}
            onClose={() => setShowDrawer(false)}
            visible={showDrawer}
          >
            <RightMenu mode="inline" cartItems={cartItems}></RightMenu>
          </Drawer>
        </div>
      </nav>
    </Row>
  );
}

export default NavBar;
