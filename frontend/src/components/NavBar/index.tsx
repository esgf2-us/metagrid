import { MenuUnfoldOutlined } from '@ant-design/icons';
import { Drawer, Typography } from 'antd';
import React from 'react';
import { useAsync } from 'react-async';
import { useRecoilState } from 'recoil';
import { fetchProjects, ResponseError } from '../../api';
import esgfLogo from '../../assets/img/esgf.png';
import { RawProject } from '../Facets/types';
import Button from '../General/Button';
import LeftMenu from './LeftMenu';
import './NavBar.css';
import RightMenu from './RightMenu';
import { isDarkModeAtom } from '../App/recoil/atoms';

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

  const [isDarkMode] = useRecoilState<boolean>(isDarkModeAtom);

  let className = 'navbar';
  if (isDarkMode) {
    className += ' dark-mode';
  }

  return (
    <nav data-testid="nav-bar" className={className}>
      <div className="navbar-container">
        <div className="navbar-logo">
          <Link
            href="https://esgf.github.io/nodes.html"
            style={{
              fontWeight: 'bold',
              fontSize: '.9em',
            }}
          >
            <img
              style={{
                height: '82px',
                marginLeft: '-5px',
                marginBottom: '-30px',
                marginTop: '-20px',
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
        <Button className="navbar-mobile-button" type="default" onClick={() => setShowDrawer(true)}>
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
