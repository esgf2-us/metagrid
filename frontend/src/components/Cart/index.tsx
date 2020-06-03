import React from 'react';
import { useLocation, useHistory } from 'react-router-dom';
import { Col, Row, Tabs } from 'antd';
import {
  QuestionCircleOutlined,
  ShoppingCartOutlined,
  BookOutlined,
} from '@ant-design/icons';

import Table from '../Search/Table';
import Alert from '../Feedback/Alert';
import Button from '../General/Button';
import Popconfirm from '../Feedback/Popconfirm';

const styles = {
  summary: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 10,
    leftSide: {
      display: 'flex',
    } as React.CSSProperties,
  },
};

export type Props = {
  cart: SearchResult[] | [];
  handleCart: (item: SearchResult[], action: string) => void;
  clearCart: () => void;
};

const Cart: React.FC<Props> = ({ cart, handleCart, clearCart }) => {
  const [activeTab, setActiveTab] = React.useState<'items' | 'searches'>(
    'items'
  );
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
  const handlesTabClick = (key: 'items' | 'searches'): void => {
    history.push(key);
    setActiveTab(key);
  };

  return (
    <div data-testid="cart">
      <Tabs
        activeKey={activeTab}
        animated={false}
        onTabClick={(key: 'items' | 'searches') => handlesTabClick(key)}
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
          <div style={styles.summary}>
            <div style={styles.summary.leftSide}>
              {cart.length === 0 && (
                <Alert message="Your cart is empty" type="info" showIcon />
              )}
            </div>
            {cart.length > 0 && (
              <Popconfirm
                icon={<QuestionCircleOutlined style={{ color: 'red' }} />}
                onConfirm={() => clearCart()}
              >
                <span>
                  <Button danger>Remove All Items</Button>
                </span>
              </Popconfirm>
            )}
          </div>
          <Row gutter={[24, 16]} justify="space-around">
            <Col lg={24}>
              <Table
                loading={false}
                results={cart}
                cart={cart}
                handleCart={handleCart}
              />
            </Col>
          </Row>
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
          Content of Tab Pane 2
        </Tabs.TabPane>
      </Tabs>
    </div>
  );
};

export default Cart;
