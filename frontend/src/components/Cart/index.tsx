import React from 'react';
import { useLocation, useHistory } from 'react-router-dom';
import { Col, Row, Tabs, Typography } from 'antd';
import {
  QuestionCircleOutlined,
  ShoppingCartOutlined,
  BookOutlined,
  DeleteOutlined,
  SearchOutlined,
  LinkOutlined,
} from '@ant-design/icons';

import Table from '../Search/Table';
import Card from '../DataDisplay/Card';
import ToolTip from '../DataDisplay/ToolTip';
import Alert from '../Feedback/Alert';
import Popconfirm from '../Feedback/Popconfirm';
import Button from '../General/Button';

import { stringifyConstraints } from '../Search';
import { genUrlQuery } from '../../utils/api';

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
  savedSearches: SavedSearch[] | [];
  handleCart: (item: SearchResult[], action: string) => void;
  clearCart: () => void;
};

const Cart: React.FC<Props> = ({
  cart,
  savedSearches,
  clearCart,
  handleCart,
}) => {
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
          <div>
            <Row gutter={[18, 18]}>
              {savedSearches.length > 0 &&
                (savedSearches as SavedSearch[]).map(
                  (search: SavedSearch, index: number) => {
                    return (
                      <Col xs={20} sm={16} md={12} lg={10} xl={8}>
                        <Card
                          hoverable
                          title={
                            <>
                              <p>
                                Search #{index + 1}:{' '}
                                <span style={{ fontWeight: 'bold' }}>
                                  {search.numResults}
                                </span>{' '}
                                results found for {search.project.name}
                              </p>
                            </>
                          }
                          actions={[
                            <ToolTip
                              title="Apply search criteria and view results"
                              trigger="hover"
                            >
                              <SearchOutlined key="search" />
                            </ToolTip>,
                            <ToolTip title="View results in JSON format">
                              <a
                                href={genUrlQuery(
                                  search.project.facets_url,
                                  search.textInputs,
                                  search.activeFacets,
                                  { page: 0, pageSize: 10 }
                                )}
                                rel="noopener noreferrer"
                                target="blank_"
                              >
                                <LinkOutlined key="json" /> JSON
                              </a>
                            </ToolTip>,
                            <ToolTip title="Remove search criteria from library">
                              <DeleteOutlined
                                style={{ color: 'red' }}
                                key="remove"
                              />
                            </ToolTip>,
                          ]}
                        >
                          <p>
                            <span style={{ fontWeight: 'bold' }}>
                              Project:{' '}
                            </span>
                            {search.project.full_name}
                          </p>

                          {search.project.description !== null && (
                            <p>{search.project.description}</p>
                          )}

                          <p>
                            <span style={{ fontWeight: 'bold' }}>
                              Query String:{' '}
                            </span>
                            <Typography.Text code>
                              {stringifyConstraints(
                                search.activeFacets,
                                search.textInputs
                              )}
                            </Typography.Text>
                          </p>
                        </Card>
                      </Col>
                    );
                  }
                )}
            </Row>
          </div>
        </Tabs.TabPane>
      </Tabs>
    </div>
  );
};

export default Cart;
