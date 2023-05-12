import {
  CloudDownloadOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons';
import { Col, Popconfirm, Row } from 'antd';
import React from 'react';
import { useRecoilState } from 'recoil';
import { cartTourTargets } from '../../common/reactJoyrideSteps';
import { CSSinJS } from '../../common/types';
import Empty from '../DataDisplay/Empty';
import Button from '../General/Button';
import Table from '../Search/Table';
import { RawSearchResults } from '../Search/types';
import DatasetDownload from '../Globus/DatasetDownload';
import { saveSessionValue } from '../../api';
import CartStateKeys, { cartItemSelections } from './recoil/atoms';

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
  userCart: RawSearchResults | [];
  onUpdateCart: (item: RawSearchResults, operation: 'add' | 'remove') => void;
  onClearCart: () => void;
};

const Items: React.FC<Props> = ({ userCart, onUpdateCart, onClearCart }) => {
  const [itemSelections, setItemSelections] = useRecoilState<RawSearchResults>(
    cartItemSelections
  );

  const handleRowSelect = (selectedRows: RawSearchResults | []): void => {
    saveSessionValue(CartStateKeys.cartItemSelections, selectedRows);
    setItemSelections(selectedRows);
  };

  return (
    <div data-testid="cartItems">
      {userCart.length === 0 && (
        <Empty description="Your cart is empty"></Empty>
      )}
      {userCart.length > 0 && (
        <>
          <div style={styles.summary}>
            {userCart.length > 0 && (
              <Popconfirm
                title=""
                icon={<QuestionCircleOutlined style={{ color: 'red' }} />}
                onConfirm={onClearCart}
              >
                <span>
                  <Button
                    className={cartTourTargets.removeItemsBtn.class()}
                    danger
                  >
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
                userCart={userCart}
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
              Select datasets in your cart and confirm your download preference.
              Speeds will vary based on your bandwidth and distance from the
              data node serving the files.
            </p>
            <DatasetDownload />
          </div>
        </>
      )}
    </div>
  );
};

export default Items;
