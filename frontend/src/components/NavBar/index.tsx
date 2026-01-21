import { MenuUnfoldOutlined } from '@ant-design/icons';
import { Drawer, Typography } from 'antd';
import React, { CSSProperties, ReactNode } from 'react';
import { useAtomValue } from 'jotai';
import esgfLogo from '../../assets/img/esgf.png';
import Button from '../General/Button';
import './NavBar.css';
import RightMenu from './RightMenu';
import { isDarkModeAtom } from '../../common/atoms';

const { Link } = Typography;

export function createCustomIcon(src: string, alt: string, style?: CSSProperties): ReactNode {
  return (
    <div>
      <img src={src} alt={alt} style={style} />
    </div>
  );
}

const NavBar: React.FC = () => {
  // Global states
  const isDarkMode = useAtomValue<boolean>(isDarkModeAtom);

  const [showDrawer, setShowDrawer] = React.useState(false);

  let className = 'navbar';
  if (isDarkMode) {
    className += ' dark-mode';
  }

  return (
    <nav data-testid="nav-bar" className={className}>
      <div className="navbar-container">
        <div className="navbar-logo" data-testid="nav-bar-logo">
          <Link
            href={import.meta.env.VITE_FEDERATED_NODES_URL || 'https://esgf.github.io/nodes.html'}
            target="_blank"
            style={{
              fontWeight: 'bold',
              fontSize: '.9em',
            }}
          >
            {createCustomIcon(esgfLogo, 'ESGF Federated Nodes', {
              height: '82px',
              marginLeft: '-5px',
              marginBottom: '-30px',
              marginTop: '-20px',
            })}
            Federated Nodes
          </Link>
        </div>
        <div className="navbar-left"></div>
        <div className="navbar-right">
          <RightMenu mode="horizontal"></RightMenu>
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
          <RightMenu mode="inline"></RightMenu>
        </Drawer>
      </div>
    </nav>
  );
};

export default NavBar;
