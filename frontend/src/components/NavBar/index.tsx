import { MenuUnfoldOutlined } from '@ant-design/icons';
import { Drawer } from 'antd';
import React from 'react';
import { useAsync } from 'react-async';
import { Link } from 'react-router-dom';
import { fetchProjects, ResponseError } from '../../api';
import esgfLogo from '../../assets/img/esgf_logo.png';
import { RawProject } from '../Facets/types';
import Button from '../General/Button';
import LeftMenu from './LeftMenu';
import './NavBar.css';
import RightMenu from './RightMenu';

export type Props = {
  numCartItems: number;
  numSavedSearches: number;
  onTextSearch: (selectedProject: RawProject, text: string) => void;
  supportModalVisible: (visible: boolean) => void;
};

const NavBar: React.FC<Props> = ({
  numCartItems,
  numSavedSearches,
  onTextSearch,
  supportModalVisible,
}) => {
  const { data, error, isLoading } = useAsync(fetchProjects);
  const [showDrawer, setShowDrawer] = React.useState(false);

  return (
    <nav data-testid="nav-bar" className="navbar">
      <div className="navbar-logo">
        <Link to="https://www.esgf.io/nodes.html">
          <img
            style={{ maxWidth: '80%', height: 'auto' }}
            src={esgfLogo}
            alt="ESGF Federated Nodes"
          />
        </Link>
        &nbsp;
        <Link
          style={{ padding: 0, margin: 0, fontWeight: 'bold' }}
          to="https://www.esgf.io/nodes.html"
        >
          Federated Nodes
        </Link>
      </div>
      <div className="navbar-container">
        <div className="navbar-left">
          <LeftMenu
            projects={data ? data.results : undefined}
            apiError={error as ResponseError}
            apiIsLoading={isLoading}
            onTextSearch={onTextSearch}
          ></LeftMenu>
        </div>
        <div className="navbar-right">
          <RightMenu
            mode="horizontal"
            numCartItems={numCartItems}
            numSavedSearches={numSavedSearches}
            supportModalVisible={supportModalVisible}
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
            supportModalVisible={supportModalVisible}
          ></RightMenu>
        </Drawer>
      </div>
    </nav>
  );
};

export default NavBar;
