import { MenuUnfoldOutlined } from '@ant-design/icons';
import { Drawer } from 'antd';
import React from 'react';
import { useAsync } from 'react-async';
import { Link } from 'react-router-dom';
import { fetchProjects } from '../../api';
import esgfLogo from '../../assets/img/esgf_logo.png';
import { RawProject } from '../Facets/types';
import Alert from '../Feedback/Alert';
import Spin from '../Feedback/Spin';
import Button from '../General/Button';
import LeftMenu from './LeftMenu';
import './NavBar.css';
import RightMenu from './RightMenu';

const styles = {
  spin: { display: 'flex', justifyContent: 'center' },
};

export type Props = {
  activeProject: RawProject | Record<string, unknown>;
  numCartItems: number;
  numSavedSearches: number;
  onProjectChange: (selectedProj: RawProject) => void;
  onSearch: (text: string) => void;
};

const NavBar: React.FC<Props> = ({
  activeProject,
  numCartItems,
  numSavedSearches,
  onSearch,
  onProjectChange,
}) => {
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
          <RightMenu
            mode="horizontal"
            numCartItems={numCartItems}
            numSavedSearches={numSavedSearches}
          ></RightMenu>
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
          <RightMenu
            mode="inline"
            numCartItems={numCartItems}
            numSavedSearches={numSavedSearches}
          ></RightMenu>
        </Drawer>
      </div>
    </nav>
  );
};

export default NavBar;
