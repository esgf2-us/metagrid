import React from 'react';
import PropTypes from 'prop-types';
import { Col, Row } from 'antd';

import SearchTable from '../Search/SearchTable';

function Cart({ cart, handleCart }) {
  Cart.propTypes = {
    cart: PropTypes.arrayOf(PropTypes.objectOf(PropTypes.any)).isRequired,
    handleCart: PropTypes.func.isRequired,
  };

  return (
    <div data-testid="cart">
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
