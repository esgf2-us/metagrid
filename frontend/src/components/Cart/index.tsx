import { BookOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import { Tabs } from 'antd';
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cartTourTargets } from '../../common/reactJoyrideSteps';
import { RawSearchResults } from '../Search/types';
import Items from './Items';
import Searches from './Searches';
import { UserSearchQueries, UserSearchQuery } from './types';

export type Props = {
  userCart: RawSearchResults | [];
  userSearchQueries: UserSearchQueries | [];
  onUpdateCart: (item: RawSearchResults, operation: 'add' | 'remove') => void;
  onClearCart: () => void;
  onRunSearchQuery: (savedSearch: UserSearchQuery) => void;
  onRemoveSearchQuery: (uuid: string) => void;
};

const Cart: React.FC<Props> = ({
  userCart,
  userSearchQueries,
  onUpdateCart,
  onClearCart,
  onRunSearchQuery,
  onRemoveSearchQuery,
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

  return (
    <div data-testid="cart">
      <Tabs activeKey={activeTab} animated={false} onTabClick={handleTabClick}>
        <Tabs.TabPane
          tab={
            <span className={cartTourTargets.datasetBtn.class()}>
              <ShoppingCartOutlined />
              Datasets
            </span>
          }
          key="items"
        >
          <Items
            userCart={userCart}
            onUpdateCart={onUpdateCart}
            onClearCart={onClearCart}
          />
        </Tabs.TabPane>

        <Tabs.TabPane
          tab={
            <span className={cartTourTargets.libraryBtn.class()}>
              <BookOutlined />
              Search Library
            </span>
          }
          key="searches"
        >
          <Searches
            userSearchQueries={userSearchQueries}
            onRunSearchQuery={onRunSearchQuery}
            onRemoveSearchQuery={onRemoveSearchQuery}
          />
        </Tabs.TabPane>
      </Tabs>
    </div>
  );
};

export default Cart;
