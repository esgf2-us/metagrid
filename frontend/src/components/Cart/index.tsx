import { BookOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import { Tabs } from 'antd';
import React from 'react';
import { useHistory } from 'react-router-dom';
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
  const history = useHistory();

  React.useEffect(() => {
    if (history.location.pathname.includes('searches')) {
      setActiveTab('searches');
    } else {
      setActiveTab('items');
    }
  }, [history.location.pathname]);

  const handleTabClick = (key: string): void => {
    history.push(key);
    setActiveTab(key);
  };

  return (
    <div data-testid="cart">
      <Tabs activeKey={activeTab} animated={false} onTabClick={handleTabClick}>
        <Tabs.TabPane
          tab={
            <span>
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
            <span>
              <BookOutlined />
              Search Criteria
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
