import React from 'react';

import { Col, Row } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';

import Table from '../Search/Table';
import Alert from '../Feedback/Alert';
import Popconfirm from '../Feedback/Popconfirm';
import Button from '../General/Button';

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

const Items: React.FC<Props> = ({ cart, handleCart, clearCart }) => {
  return (
    <>
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
    </>
  );
};

export default Items;
