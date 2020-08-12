import {
  CloudDownloadOutlined,
  DownloadOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons';
import { Col, Form, message, Row, Select } from 'antd';
import React from 'react';
import { fetchWgetScript, openDownloadURL } from '../../api/index';
import Empty from '../DataDisplay/Empty';
import Popconfirm from '../Feedback/Popconfirm';
import Button from '../General/Button';
import Table from '../Search/Table';

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
  image: { margin: '1em', width: '25%' },
};

export type Props = {
  cart: RawSearchResult[] | [];
  handleCart: (item: RawSearchResult[], operation: 'add' | 'remove') => void;
  clearCart: () => void;
};

const Items: React.FC<Props> = ({ cart, handleCart, clearCart }) => {
  const [form] = Form.useForm();

  // TODO: Add 'Globus' as a download option
  // Available download options for datasets (batch download of files)
  const downloadOptions = ['wget'];

  // Items selected in the data table
  const [selectedItems, setSelectedItems] = React.useState<
    RawSearchResult[] | []
  >([]);

  /**
   * Handles when the user selects datasets for download
   */
  const handleSelect = (selectedRows: RawSearchResult[] | []): void => {
    setSelectedItems(selectedRows);
  };

  /**
   * Handles the download form
   * TODO: Add handle for Globus
   */
  const handleDownloadForm = (downloadType: 'wget' | 'Globus'): void => {
    /* istanbul ignore else */
    if (downloadType === 'wget') {
      const ids = (selectedItems as RawSearchResult[]).map((item) => item.id);
      fetchWgetScript(ids)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .then((url) => {
          openDownloadURL(url);
        })
        .catch(() => {
          // eslint-disable-next-line no-void
          void message.error(
            'There was an issue fetching the wget script. Please contact support or try again later.'
          );
        });
    }
  };

  return (
    <div data-testid="cartItems">
      {cart.length === 0 && <Empty description="Your cart is empty"></Empty>}
      {cart.length > 0 && (
        <>
          <div style={styles.summary}>
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
                handleRowSelect={handleSelect}
              />
            </Col>
          </Row>
          <div data-testid="downloadForm">
            <h1>
              <CloudDownloadOutlined /> Download Your Cart
            </h1>
            <p></p>
            <p>
              Select datasets in your cart and confirm your download preference.
              Speeds will vary based on your bandwidth and distance from the
              data node serving the files.
            </p>
            <Form
              form={form}
              layout="inline"
              onFinish={({ downloadType }) => handleDownloadForm(downloadType)}
              initialValues={{
                downloadType: downloadOptions[0],
              }}
            >
              <Form.Item name="downloadType">
                <Select style={{ width: 235 }}>
                  {downloadOptions.map((option) => (
                    <Select.Option key={option} value={option}>
                      {option}
                    </Select.Option>
                  ))}
                  /
                </Select>
              </Form.Item>
              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<DownloadOutlined />}
                  disabled={selectedItems.length === 0}
                ></Button>
              </Form.Item>
            </Form>
          </div>
        </>
      )}
    </div>
  );
};

export default Items;
