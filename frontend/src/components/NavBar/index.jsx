import React from 'react';
import { Link } from 'react-router-dom';
import { useAsync } from 'react-async';
import PropTypes from 'prop-types';
import { Drawer } from 'antd';
import { MenuUnfoldOutlined } from '@ant-design/icons';

import Alert from '../Feedback/Alert';
import Button from '../General/Button';
import LeftMenu from './LeftMenu';
import RightMenu from './RightMenu';
import './NavBar.css';

import { fetchProjects } from '../../utils/api';
import esgfLogo from '../../assets/img/esgf_logo.png';
import Spin from '../Feedback/Spin';

const styles = {
  spin: { display: 'flex', justifyContent: 'center' },
};

function NavBar({ activeProject, cartItems, onSearch, onProjectChange }) {
  const { data, error, isLoading } = useAsync(fetchProjects);
  const [showDrawer, setShowDrawer] = React.useState(false);

  if (error) {
    return (
      <Alert
        message="There was an issue fetching list of projects. Please contact support or try again later."
        type="error"
      />
    );
  }

  return (
    <nav data-testid="nav-bar" className="navbar">
      <div className="navbar-logo">
        <Link to="/search">
          <img
            style={{ maxWidth: '100%', height: 'auto' }}
            src={esgfLogo}
            alt="ESGF Logo"
          />
        </Link>
      </div>

      <div className="navbar-container">
        <div className="navbar-left">
          {isLoading && (
            <div style={styles.spin}>
              <Spin />
            </div>
          )}
          {data && (
            <LeftMenu
              activeProject={activeProject}
              projects={data.results}
              onSearch={onSearch}
              onProjectChange={onProjectChange}
            ></LeftMenu>
          )}
        </div>

        <div className="navbar-right">
          <RightMenu mode="horizontal" cartItems={cartItems}></RightMenu>
        </div>
        <div data-testid="openDrawerBtn">
          <Button
            className="navbar-mobile-button"
            type="primary"
            onClick={() => setShowDrawer(true)}
          >
            <MenuUnfoldOutlined />
          </Button>
        </div>

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
  );
}

NavBar.propTypes = {
  activeProject: PropTypes.objectOf(
    PropTypes.oneOfType([PropTypes.string, PropTypes.arrayOf(PropTypes.string)])
  ).isRequired,
  cartItems: PropTypes.number.isRequired,
  onSearch: PropTypes.func.isRequired,
  onProjectChange: PropTypes.func.isRequired,
};

export default NavBar;
