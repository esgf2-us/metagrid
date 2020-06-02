import React from 'react';
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
  return (
    <div data-testid="cart">
      <Tabs defaultActiveKey="1" animated={false}>
        <Tabs.TabPane
          tab={
            <span>
              <ShoppingCartOutlined />
              Datasets
            </span>
          }
          key="1"
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
          key="2"
        >
          Content of Tab Pane 2
        </Tabs.TabPane>
      </Tabs>
    </div>
  );
};

export default Cart;
