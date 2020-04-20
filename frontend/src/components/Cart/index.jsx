import React from 'react';
import PropTypes from 'prop-types';
import { Col, Row } from 'antd';

import SearchTable from '../Search/SearchTable';
import Alert from '../Feedback/Alert';
import Button from '../General/Button';

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
  Cart.propTypes = {
    cart: PropTypes.arrayOf(PropTypes.objectOf(PropTypes.any)).isRequired,
    handleCart: PropTypes.func.isRequired,
    clearCart: PropTypes.func.isRequired,
  };

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
            <Button type="danger" onClick={() => clearCart()}>
              Remove All Items
            </Button>
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

export default Cart;
