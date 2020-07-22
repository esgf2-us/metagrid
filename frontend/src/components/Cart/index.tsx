import React from 'react';
import { useHistory } from 'react-router-dom';
import { Tabs } from 'antd';
import { ShoppingCartOutlined, BookOutlined } from '@ant-design/icons';

import Searches from './Searches';
import Items from './Items';

export type Props = {
  cart: RawSearchResult[] | [];
  savedSearches: SavedSearch[] | [];
  handleCart: (item: RawSearchResult[], operation: 'add' | 'remove') => void;
  clearCart: () => void;
  handleRemoveSearch: (uuid: string) => void;
  handleApplySearch: (savedSearch: SavedSearch) => void;
};

const Cart: React.FC<Props> = ({
  cart,
  savedSearches,
  clearCart,
  handleCart,
  handleRemoveSearch,
  handleApplySearch,
}) => {
  const [activeTab, setActiveTab] = React.useState<string>('items');
  const history = useHistory();

  /**
   * Update the active tab based on the current pathname
   */
  React.useEffect(() => {
    if (history.location.pathname.includes('searches')) {
      setActiveTab('searches');
    } else {
      setActiveTab('items');
    }
  }, [history.location.pathname]);

  /**
   * Handles tab clicking by updating the current pathname and setting the active tab
   */
  const handlesTabClick = (key: string): void => {
    history.push(key);
    setActiveTab(key);
  };

  return (
    <div data-testid="cart">
      <Tabs
        activeKey={activeTab}
        animated={false}
        onTabClick={(key: string) => handlesTabClick(key)}
      >
        <Tabs.TabPane
          tab={
            <span>
              <ShoppingCartOutlined />
              Datasets
            </span>
          }
          key="items"
        >
          <Items cart={cart} handleCart={handleCart} clearCart={clearCart} />
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
            savedSearches={savedSearches}
            handleRemoveSearch={handleRemoveSearch}
            handleApplySearch={(savedSearch: SavedSearch) =>
              handleApplySearch(savedSearch)
            }
          />
        </Tabs.TabPane>
      </Tabs>
    </div>
  );
};

export default Cart;
