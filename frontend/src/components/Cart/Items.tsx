import {
  CloudDownloadOutlined,
  DownloadOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons';
import { Col, Form, message, Row, Select } from 'antd';
import React from 'react';
import { fetchWgetScript, openDownloadURL } from '../../api/index';
import { CSSinJS } from '../../common/types';
import Empty from '../DataDisplay/Empty';
import Popconfirm from '../Feedback/Popconfirm';
import Button from '../General/Button';
import Table from '../Search/Table';
import { RawSearchResults } from '../Search/types';

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
  const [downloadForm] = Form.useForm();

  // Statically defined list of dataset download options
  // TODO: Add 'Globus'
  const downloadOptions = ['wget'];
  const [downloadIsLoading, setDownloadIsLoading] = React.useState(false);
  const [selectedItems, setSelectedItems] = React.useState<
    RawSearchResults | []
  >([]);

  const handleRowSelect = (selectedRows: RawSearchResults | []): void => {
    setSelectedItems(selectedRows);
  };

  /**
   * TODO: Add handle for Globus
   */
  const handleDownloadForm = (downloadType: 'wget' | 'Globus'): void => {
    /* istanbul ignore else */
    if (downloadType === 'wget') {
      const ids = (selectedItems as RawSearchResults).map((item) => item.id);
      // eslint-disable-next-line no-void
      void message.success(
        'The wget script is generating, please wait momentarily.',
        5
      );
      setDownloadIsLoading(true);
      fetchWgetScript(ids)
        .then((url) => {
          openDownloadURL(url);
          setDownloadIsLoading(false);
        })
        .catch(() => {
          // eslint-disable-next-line no-void
          void message.error(
            'There was an issue generating the wget script. Please contact support or try again later.'
          );
          setDownloadIsLoading(false);
        });
    }
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
                icon={<QuestionCircleOutlined style={{ color: 'red' }} />}
                onConfirm={onClearCart}
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
                canDisableRows={false}
                results={userCart}
                userCart={userCart}
                onUpdateCart={onUpdateCart}
                onRowSelect={handleRowSelect}
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
              form={downloadForm}
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
                  loading={downloadIsLoading}
                >
                  Download
                </Button>
              </Form.Item>
            </Form>
          </div>
        </>
      )}
    </div>
  );
};

export default Items;
