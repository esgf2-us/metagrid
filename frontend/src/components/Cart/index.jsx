import React from 'react';
import PropTypes from 'prop-types';
import { Col, Row } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';

import SearchTable from '../Search/SearchTable';
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
    },
  },
};
function Cart({ cart, handleCart, clearCart }) {
  return (
    <div data-testid="cart">
      <div style={styles.summary}>
        <div style={styles.summary.leftSide}>
          {cart.length === 0 && (
            <Alert message="Your cart is empty" type="info" showIcon />
          )}
        </div>
        <div>
          {cart.length > 0 && (
            <Popconfirm
              icon={<QuestionCircleOutlined style={{ color: 'red' }} />}
              onConfirm={() => clearCart()}
            >
              <Button type="danger">Remove All Items</Button>
            </Popconfirm>
          )}
        </div>
      </div>
      <Row gutter={[24, 16]} justify="space-around">
        <Col lg={24}>
          <SearchTable
            loading={false}
            results={cart}
            cart={cart}
            handleCart={handleCart}
          />
        </Col>
      </Row>
    </div>
  );
}

Cart.propTypes = {
  cart: PropTypes.arrayOf(PropTypes.objectOf(PropTypes.any)).isRequired,
  handleCart: PropTypes.func.isRequired,
  clearCart: PropTypes.func.isRequired,
};

export default Cart;
