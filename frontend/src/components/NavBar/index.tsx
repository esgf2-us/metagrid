import { MenuUnfoldOutlined } from '@ant-design/icons';
import { Drawer, Typography } from 'antd';
import React from 'react';
import { useAsync } from 'react-async';
import { fetchProjects, ResponseError } from '../../api';
import esgfLogo from '../../assets/img/esgf_logo.png';
import { RawProject } from '../Facets/types';
import Button from '../General/Button';
import LeftMenu from './LeftMenu';
import './NavBar.css';
import RightMenu from './RightMenu';

const { Link } = Typography;

export type Props = {
  numCartItems: number;
  numSavedSearches: number;
  onTextSearch: (selectedProject: RawProject, text: string) => void;
  supportModalVisible: (visible: boolean) => void;
};

const NavBar: React.FC<React.PropsWithChildren<Props>> = ({
  numCartItems,
  numSavedSearches,
  onTextSearch,
  supportModalVisible,
}) => {
  const { data, error, isLoading } = useAsync(fetchProjects);
  const [showDrawer, setShowDrawer] = React.useState(false);

  return (
    <nav data-testid="nav-bar" className="navbar">
      <div className="navbar-container">
        <div className="navbar-logo">
          <Link
            href="https://www.esgf.io/nodes.html"
            style={{
              fontWeight: 'bold',
              fontSize: '.9em',
            }}
          >
            <img
              style={{
                height: '42px',
                marginLeft: '-5px',
                marginBottom: '-10px',
              }}
              src={esgfLogo}
              alt="ESGF Federated Nodes"
            />
            <br />
            Federated Nodes
          </Link>
        </div>
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
          type="default"
          onClick={() => setShowDrawer(true)}
        >
          <MenuUnfoldOutlined />
        </Button>
        <Drawer
          placement="right"
          className="navbar-drawer"
          closable={false}
          onClose={() => setShowDrawer(false)}
          open={showDrawer}
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
