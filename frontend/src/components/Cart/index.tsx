import React from 'react';
import { useLocation, useHistory } from 'react-router-dom';
import { Tabs } from 'antd';
import { ShoppingCartOutlined, BookOutlined } from '@ant-design/icons';

import Searches from './Searches';
import Items from './Items';

export type Props = {
  cart: SearchResult[] | [];
  savedSearches: SavedSearch[] | [];
  handleCart: (item: SearchResult[], action: string) => void;
  clearCart: () => void;
  handleRemoveSearch: (id: string) => void;
};

const Cart: React.FC<Props> = ({
  cart,
  savedSearches,
  clearCart,
  handleCart,
  handleRemoveSearch,
}) => {
  const [activeTab, setActiveTab] = React.useState<string>('items');
  const history = useHistory();
  const location = useLocation();

  /**
   * Update the active tab based on the current pathname
   */
  React.useEffect(() => {
    if (location.pathname.includes('searches')) {
      setActiveTab('searches');
    } else {
      setActiveTab('items');
    }
  }, [location.pathname]);

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
            handleRemoveSearch={(id: string) => handleRemoveSearch(id)}
          />
        </Tabs.TabPane>
      </Tabs>
    </div>
  );
};

export default Cart;
