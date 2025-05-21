import { BookOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import { Tabs, TabsProps } from 'antd';
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { RawSearchResults } from '../Search/types';
import Items from './Items';
import Searches from './Searches';
import { cartTourTargets } from '../../common/joyrideTutorials/reactJoyrideSteps';

export type Props = {
  onUpdateCart: (item: RawSearchResults, operation: 'add' | 'remove') => void;
};

const Cart: React.FC<React.PropsWithChildren<Props>> = ({ onUpdateCart }) => {
  const [activeTab, setActiveTab] = React.useState<string>('items');
  const navigate = useNavigate();
  const location = useLocation();

  React.useEffect(() => {
    if (location.pathname.includes('searches')) {
      setActiveTab('searches');
    } else {
      setActiveTab('items');
    }
  }, [location.pathname]);

  const handleTabClick = (key: string): void => {
    navigate(key);
    setActiveTab(key);
  };

  const tabItems: TabsProps['items'] = [
    {
      key: 'items',
      label: (
        <span className={cartTourTargets.datasetBtn.class()}>
          <ShoppingCartOutlined />
          Datasets
        </span>
      ),
      children: <Items onUpdateCart={onUpdateCart} />,
    },
    {
      key: 'searches',
      label: (
        <span className={cartTourTargets.libraryBtn.class()}>
          <BookOutlined />
          Search Library
        </span>
      ),
      children: <Searches />,
    },
  ];

  return (
    <div data-testid="cart">
      <Tabs activeKey={activeTab} animated={false} onTabClick={handleTabClick} items={tabItems} />
    </div>
  );
};

export default Cart;
