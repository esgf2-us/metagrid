import { BookOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import { Tabs, TabsProps } from 'antd';
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cartTourTargets } from '../../common/reactJoyrideSteps';
import { RawSearchResults } from '../Search/types';
import Items from './Items';
import Searches from './Searches';
import { UserSearchQueries } from './types';
import { NodeStatusArray } from '../NodeStatus/types';

export type Props = {
  userCart: RawSearchResults | [];
  userSearchQueries: UserSearchQueries | [];
  onUpdateCart: (item: RawSearchResults, operation: 'add' | 'remove') => void;
  onClearCart: () => void;
  onRemoveSearchQuery: (uuid: string) => void;
  nodeStatus?: NodeStatusArray;
};

const Cart: React.FC<React.PropsWithChildren<Props>> = ({
  userCart,
  userSearchQueries,
  onUpdateCart,
  onClearCart,
  onRemoveSearchQuery,
  nodeStatus,
}) => {
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
      children: (
        <Items
          userCart={userCart}
          onUpdateCart={onUpdateCart}
          onClearCart={onClearCart}
          nodeStatus={nodeStatus}
        />
      ),
    },
    {
      key: 'searches',
      label: (
        <span className={cartTourTargets.libraryBtn.class()}>
          <BookOutlined />
          Search Library
        </span>
      ),
      children: (
        <Searches userSearchQueries={userSearchQueries} onRemoveSearchQuery={onRemoveSearchQuery} />
      ),
    },
  ];

  return (
    <div data-testid="cart">
      <Tabs activeKey={activeTab} animated={false} onTabClick={handleTabClick} items={tabItems} />
    </div>
  );
};

export default Cart;
