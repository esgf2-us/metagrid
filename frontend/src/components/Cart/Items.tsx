import { CloudDownloadOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { Col, Empty, Popconfirm, Row } from 'antd';
import React from 'react';
import { useAtom } from 'jotai';
import { cartTourTargets } from '../../common/joyrideTutorials/reactJoyrideSteps';
import { CSSinJS } from '../../common/types';
import Button from '../General/Button';
import Table from '../Search/Table';
import { RawSearchResults } from '../Search/types';
import DatasetDownload from '../Globus/DatasetDownload';
import { UserCart } from './types';
import { AuthContext } from '../../contexts/AuthContext';
import { updateUserCart } from '../../api';
import { cartItemSelectionsAtom, userCartAtom } from '../../common/atoms';

const styles: CSSinJS = {
  summary: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 10,
    leftSide: {
      display: 'flex',
    },
  },
  image: { margin: '1em', width: '25%' },
};

export type Props = {
  onUpdateCart: (item: RawSearchResults, operation: 'add' | 'remove') => void;
};

const Items: React.FC<React.PropsWithChildren<Props>> = ({ onUpdateCart }) => {
  // User's authentication state
  const authState = React.useContext(AuthContext);
  const { access_token: accessToken, pk } = authState;
  const isAuthenticated = accessToken && pk;

  // Global states
  const [userCart, setUserCart] = useAtom<UserCart>(userCartAtom);

  const [itemSelections, setItemSelections] = useAtom<RawSearchResults>(cartItemSelectionsAtom);

  const handleRowSelect = (selectedRows: RawSearchResults): void => {
    setItemSelections(selectedRows);
  };

  const handleClearCart = (): void => {
    setUserCart([]);
    setItemSelections([]);

    /* istanbul ignore else */
    if (isAuthenticated) {
      updateUserCart(pk, accessToken, []);
    }
  };

  return (
    <div data-testid="cartItems">
      {userCart.length === 0 && <Empty description="Your cart is empty"></Empty>}
      {userCart.length > 0 && (
        <>
          <div style={styles.summary}>
            {userCart.length > 0 && (
              <Popconfirm
                title={
                  <p>
                    Do you wish to remove all
                    <br /> items from your cart?
                  </p>
                }
                icon={<QuestionCircleOutlined style={{ color: 'red' }} />}
                onConfirm={handleClearCart}
                okButtonProps={{
                  'data-testid': 'clear-all-cart-items-confirm-button',
                }}
              >
                <span data-testid="clear-cart-button">
                  <Button className={cartTourTargets.removeItemsBtn.class()} danger>
                    Remove All Items
                  </Button>
                </span>
              </Popconfirm>
            )}
          </div>
          <Row gutter={[24, 16]} justify="space-around">
            <Col lg={24}>
              <Table
                loading={false}
                canDisableRows={false}
                results={userCart}
                onUpdateCart={onUpdateCart}
                onRowSelect={handleRowSelect}
                selections={itemSelections}
              />
            </Col>
          </Row>
          <div data-testid="downloadForm">
            <h1>
              <CloudDownloadOutlined /> Download Your Cart
            </h1>
            <p>
              Select datasets in your cart and confirm your download preference. Speeds will vary
              based on your bandwidth and distance from the data node serving the files.
            </p>
            <DatasetDownload />
          </div>
        </>
      )}
    </div>
  );
};

export default Items;
